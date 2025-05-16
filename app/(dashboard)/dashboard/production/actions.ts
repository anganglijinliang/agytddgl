"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ProductionWithDetails } from "@/types/extended-types";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProductionStatus, ShiftType, TeamType } from "@prisma/client";
import { z } from "zod";
import { OrderStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/session";
import { createAuditLog } from "@/lib/create-audit-log";

// 获取所有生产记录
export async function getProductions(): Promise<ProductionWithDetails[]> {
  try {
    const productions = await db.production.findMany({
      include: {
        user: true,
        subOrder: {
          include: {
            order: {
              include: {
                customer: true,
              },
            },
            productionLine: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return productions as ProductionWithDetails[];
  } catch (error) {
    console.error("获取生产记录失败:", error);
    throw new Error("获取生产记录失败");
  }
}

// 获取单个生产记录
export async function getProduction(id: string): Promise<ProductionWithDetails | null> {
  try {
    const production = await db.production.findUnique({
      where: { id },
      include: {
        user: true,
        subOrder: {
          include: {
            order: {
              include: {
                customer: true,
              },
            },
            productionLine: true,
          },
        },
      },
    });

    return production as ProductionWithDetails;
  } catch (error) {
    console.error("获取生产记录详情失败:", error);
    throw new Error("获取生产记录详情失败");
  }
}

// 定义生产记录表单架构
const productionFormSchema = z.object({
  subOrderId: z.string({
    required_error: "请选择子订单",
  }),
  productionLineId: z.string({
    required_error: "请选择生产线",
  }),
  team: z.nativeEnum(TeamType, {
    required_error: "请选择班组",
  }),
  shift: z.nativeEnum(ShiftType, {
    required_error: "请选择班次",
  }),
  productionDate: z.date({
    required_error: "请选择生产日期",
  }),
  quantity: z.coerce
    .number({
      required_error: "请输入生产支数",
      invalid_type_error: "请输入有效的数字",
    })
    .min(1, { message: "生产支数必须大于0" }),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  qualityNotes: z.string().optional(),
  materialUsage: z.string().optional(),
  notes: z.string().optional(),
  status: z.union([
    z.nativeEnum(ProductionStatus),
    z.literal("COMPLETED"),
    z.literal("PAUSED")
  ]).optional(),
});

export type ProductionFormValues = z.infer<typeof productionFormSchema>;

// 创建生产记录
export async function createProduction(data: ProductionFormValues) {
  try {
    // 获取当前用户
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: "未授权操作" };
    }

    // 获取子订单详情
    const subOrder = await db.subOrder.findUnique({
      where: {
        id: data.subOrderId,
      },
      include: {
        order: true,
        production: true,
      },
    });

    if (!subOrder) {
      return { success: false, message: "无效的子订单ID" };
    }

    // 判断生产数量是否合理
    const producedQuantity = subOrder.production.reduce(
      (sum, prod) => sum + prod.quantity,
      0
    );
    const remainingQuantity = subOrder.plannedQuantity - producedQuantity;

    if (data.quantity > remainingQuantity) {
      return {
        success: false,
        message: `生产支数不能超过剩余计划支数 ${remainingQuantity}`,
      };
    }

    // 创建生产记录
    const production = await db.production.create({
      data: {
        subOrderId: data.subOrderId,
        productionLineId: data.productionLineId,
        userId: user.id,
        team: data.team,
        shift: data.shift,
        productionDate: data.productionDate,
        quantity: data.quantity,
        status: ProductionStatus.FINISHED,
        startTime: data.startTime,
        endTime: data.endTime,
        qualityNotes: data.qualityNotes,
        materialUsage: data.materialUsage,
        notes: data.notes,
      },
    });

    // 更新子订单状态
    const updatedProducedQuantity = producedQuantity + data.quantity;
    const isCompleted = updatedProducedQuantity >= subOrder.plannedQuantity;

    // 检查整个订单的状态
    await updateOrderStatus(subOrder.orderId);

    // 记录审计日志
    await createAuditLog({
      action: "CREATE",
      resource: "PRODUCTION",
      resourceId: production.id,
      description: `创建了生产记录: ${subOrder.specification}/${subOrder.grade}, 数量: ${data.quantity}`,
      metadata: JSON.stringify(production),
    });

    revalidatePath("/dashboard/production");
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${subOrder.orderId}`);

    return { success: true, data: production };
  } catch (error) {
    console.error("创建生产记录失败:", error);
    return {
      success: false,
      message: "创建生产记录失败，请重试",
    };
  }
}

// 更新生产记录
export async function updateProduction(id: string, values: ProductionFormValues) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      redirect("/login");
    }

    const result = productionFormSchema.safeParse(values);
    
    if (!result.success) {
      return { error: "表单数据验证失败" };
    }

    // 获取当前生产记录
    const currentProduction = await db.production.findUnique({
      where: { id },
      include: {
        subOrder: {
          include: {
            order: true,
            production: true,
          },
        },
      },
    });

    if (!currentProduction) {
      return { error: "生产记录不存在" };
    }

    // 计算已生产数量并检查是否超出计划
    const subOrder = currentProduction.subOrder;
    const existingProduction = subOrder.production || [];
    const totalProducedExcludingCurrent = existingProduction
      .filter(p => p.id !== id)
      .reduce((sum, p) => sum + p.quantity, 0);
    
    const remainingQuantity = subOrder.plannedQuantity - totalProducedExcludingCurrent;

    if (values.quantity > remainingQuantity) {
      return { error: `生产数量超过计划数量，剩余可生产: ${remainingQuantity}` };
    }

    // 状态映射 - 将前端状态映射为数据库有效的状态
    let dbStatus: ProductionStatus = ProductionStatus.FINISHED;
    if (values.status) {
      if (values.status === ProductionStatus.NOT_STARTED) {
        dbStatus = ProductionStatus.NOT_STARTED;
      } else if (values.status === ProductionStatus.IN_PROGRESS) {
        dbStatus = ProductionStatus.IN_PROGRESS;
      } else if (values.status === ProductionStatus.FINISHED || values.status === "COMPLETED") {
        dbStatus = ProductionStatus.FINISHED;
      } else if (values.status === "PAUSED") {
        dbStatus = ProductionStatus.NOT_STARTED;
      }
    }

    // 更新生产记录
    await db.production.update({
      where: { id },
      data: {
        status: dbStatus,
        team: values.team,
        shift: values.shift,
        productionDate: values.productionDate,
        quantity: values.quantity,
        startTime: values.startTime || null,
        endTime: values.endTime || null,
        qualityNotes: values.qualityNotes || null,
        materialUsage: values.materialUsage || null,
        notes: values.notes || null,
      },
    });

    // 记录审计日志
    await createAuditLog({
      action: "UPDATE",
      resource: "PRODUCTION",
      resourceId: id,
      description: `更新了订单 ${subOrder.order.orderNumber} 的生产记录，数量: ${values.quantity}`,
      metadata: JSON.stringify(values),
    });

    revalidatePath("/dashboard/production");
    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${subOrder.orderId}`);

    return { success: true };
  } catch (error: any) {
    console.error("更新生产记录失败:", error);
    return { error: `更新生产记录失败: ${error.message}` };
  }
}

// 删除生产记录
export async function deleteProduction(id: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      redirect("/login");
    }

    // 获取当前生产记录
    const production = await db.production.findUnique({
      where: { id },
      include: {
        subOrder: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!production) {
      throw new Error("生产记录不存在");
    }

    // 删除生产记录
    await db.production.delete({
      where: { id },
    });

    // 记录审计日志
    await db.auditLog.create({
      data: {
        userId,
        action: "DELETE",
        resource: "PRODUCTION",
        resourceId: id,
        description: `删除了订单 ${production.subOrder.order.orderNumber} 的生产记录`,
      },
    });

    revalidatePath("/dashboard/production");
    return { success: true };
  } catch (error) {
    console.error("删除生产记录失败:", error);
    throw new Error("删除生产记录失败");
  }
}

// 获取下拉选项数据
export async function getDropdownData() {
  try {
    // 获取所有未完成的子订单
    const subOrders = await db.subOrder.findMany({
      where: {
        order: {
          status: {
            in: ["CONFIRMED", "IN_PRODUCTION"],
          },
        },
      },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
        production: true,
      },
    });

    // 过滤出未完成生产的子订单
    const availableSubOrders = subOrders.filter(subOrder => {
      const totalProduced = (subOrder.production || []).reduce(
        (sum, p) => sum + p.quantity, 
        0
      );
      return totalProduced < subOrder.plannedQuantity;
    }).map(so => ({
      id: so.id,
      label: `${so.order.orderNumber} - ${so.order.customer.name} - ${so.specification} - 计划:${so.plannedQuantity}`,
      plannedQuantity: so.plannedQuantity,
      produced: (so.production || []).reduce((sum, p) => sum + p.quantity, 0),
    }));

    return { 
      subOrders: availableSubOrders,
    };
  } catch (error) {
    console.error("获取下拉选项数据失败:", error);
    throw new Error("获取下拉选项数据失败");
  }
}

/**
 * 更新订单状态
 */
export async function updateOrderStatus(orderId: string) {
  try {
    // 获取订单及其子订单
    const order = await db.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        subOrders: {
          include: {
            production: true,
            shipping: true,
          },
        },
      },
    });

    if (!order) {
      return { success: false, message: "订单不存在" };
    }

    // 计算生产和发运状态
    let totalPlannedQuantity = 0;
    let totalProducedQuantity = 0;
    let totalShippedQuantity = 0;

    order.subOrders.forEach((subOrder) => {
      totalPlannedQuantity += subOrder.plannedQuantity;

      subOrder.production.forEach((prod) => {
        totalProducedQuantity += prod.quantity;
      });

      subOrder.shipping.forEach((ship) => {
        totalShippedQuantity += ship.quantity;
      });
    });

    // 确定订单状态
    let newStatus = order.status;

    // 如果订单处于草稿状态，不进行更新
    if (order.status === OrderStatus.DRAFT) {
      return { success: true };
    }

    // 如果有任何生产记录，订单至少是生产中
    if (totalProducedQuantity > 0 && order.status === OrderStatus.CONFIRMED) {
      newStatus = OrderStatus.IN_PRODUCTION;
    }

    // 如果生产完成，并且有部分发运
    if (
      totalProducedQuantity >= totalPlannedQuantity &&
      totalShippedQuantity > 0 &&
      totalShippedQuantity < totalPlannedQuantity
    ) {
      newStatus = OrderStatus.PARTIALLY_SHIPPED;
    }

    // 如果生产和发运都完成
    if (
      totalProducedQuantity >= totalPlannedQuantity &&
      totalShippedQuantity >= totalPlannedQuantity
    ) {
      newStatus = OrderStatus.COMPLETED;
    }

    // 如果状态发生变化，更新订单
    if (newStatus !== order.status) {
      await db.order.update({
        where: {
          id: orderId,
        },
        data: {
          status: newStatus,
        },
      });

      // 记录订单状态变更日志
      await createAuditLog({
        action: "CHANGE_STATUS",
        resource: "ORDER",
        resourceId: orderId,
        description: `订单状态从 ${order.status} 更新为 ${newStatus}`,
        metadata: JSON.stringify({
          previousStatus: order.status,
          newStatus,
          totalPlannedQuantity,
          totalProducedQuantity,
          totalShippedQuantity,
        }),
      });
    }

    return { success: true };
  } catch (error) {
    console.error("更新订单状态失败:", error);
    return { success: false, message: "更新订单状态失败" };
  }
}

/**
 * 获取生产统计数据
 */
export async function getProductionStats() {
  try {
    // 获取今日生产记录
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayProductions = await db.production.findMany({
      where: {
        productionDate: {
          gte: today,
        },
      },
      include: {
        subOrder: {
          select: {
            specification: true,
            grade: true,
          },
        },
      },
    });
    
    // 计算今日总产量
    const todayTotal = todayProductions.reduce(
      (sum, prod) => sum + prod.quantity,
      0
    );
    
    // 按班组统计
    const teamStats = await db.production.groupBy({
      by: ["team"],
      _sum: {
        quantity: true,
      },
      where: {
        productionDate: {
          gte: new Date(new Date().setDate(today.getDate() - 30)),
        },
      },
    });
    
    // 按产线统计
    const lineStats = await db.production.groupBy({
      by: ["productionLineId"],
      _sum: {
        quantity: true,
      },
      where: {
        productionDate: {
          gte: new Date(new Date().setDate(today.getDate() - 30)),
        },
      },
    });
    
    // 获取产线信息
    const productionLines = await db.productionLine.findMany({
      where: {
        id: {
          in: lineStats.map((item) => item.productionLineId),
        },
      },
    });
    
    // 组合产线统计
    const lineStatsWithNames = lineStats.map((item) => {
      const line = productionLines.find((l) => l.id === item.productionLineId);
      return {
        productionLineId: item.productionLineId,
        productionLineName: line?.name || "未知产线",
        quantity: item._sum.quantity || 0,
      };
    });
    
    return {
      todayTotal,
      todayDetails: todayProductions.map((p) => ({
        id: p.id,
        quantity: p.quantity,
        team: p.team,
        shift: p.shift,
        specification: p.subOrder.specification,
        grade: p.subOrder.grade,
      })),
      teamStats: teamStats.map((item) => ({
        team: item.team,
        quantity: item._sum.quantity || 0,
      })),
      lineStats: lineStatsWithNames,
    };
  } catch (error) {
    console.error("获取生产统计失败:", error);
    return {
      todayTotal: 0,
      todayDetails: [],
      teamStats: [],
      lineStats: [],
    };
  }
} 