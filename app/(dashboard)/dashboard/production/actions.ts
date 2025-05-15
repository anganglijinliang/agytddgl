"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ProductionWithDetails } from "@/types/extended-types";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProductionStatus, ShiftType, TeamType } from "@prisma/client";
import { z } from "zod";

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

const productionFormSchema = z.object({
  subOrderId: z.string().min(1, "订单项目为必填项"),
  status: z.union([z.nativeEnum(ProductionStatus), z.literal("COMPLETED"), z.literal("PAUSED")]),
  team: z.nativeEnum(TeamType),
  shift: z.nativeEnum(ShiftType),
  quantity: z.number().min(1, "数量必须大于0"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().optional(),
});

export type ProductionFormValues = z.infer<typeof productionFormSchema>;

// 创建生产记录
export async function createProduction(values: ProductionFormValues) {
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

    // 获取子订单信息
    const subOrder = await db.subOrder.findUnique({
      where: { id: values.subOrderId },
      include: {
        order: true,
        production: true,
      },
    });

    if (!subOrder) {
      return { error: "订单项目不存在" };
    }

    // 计算已生产数量
    const existingProduction = subOrder.production || [];
    const totalProduced = existingProduction.reduce((sum, p) => sum + p.quantity, 0);
    const remainingQuantity = subOrder.plannedQuantity - totalProduced;

    if (values.quantity > remainingQuantity) {
      return { error: `生产数量超过计划数量，剩余可生产: ${remainingQuantity}` };
    }

    // 状态映射 - 将前端状态映射为数据库有效的状态
    let dbStatus;
    if (values.status === "COMPLETED") {
      dbStatus = "FINISHED";
    } else if (values.status === "PAUSED") {
      dbStatus = "NOT_STARTED"; // 或其他合适的值
    } else {
      dbStatus = values.status; // NOT_STARTED 或 IN_PROGRESS 不需要映射
    }

    // 创建生产记录
    await db.production.create({
      data: {
        status: dbStatus as ProductionStatus,
        team: values.team,
        shift: values.shift,
        quantity: values.quantity,
        startTime: values.startTime ? new Date(values.startTime) : null,
        endTime: values.endTime ? new Date(values.endTime) : null,
        notes: values.notes,
        userId,
        subOrderId: values.subOrderId,
        productionLineId: subOrder.productionLineId || "",
        productionDate: new Date(),
      },
    });

    // 检查是否需要更新订单状态
    const newTotalProduced = totalProduced + values.quantity;
    if (newTotalProduced >= subOrder.plannedQuantity) {
      // 如果生产完成，更新子订单的状态
      // 获取所有子订单的状态来决定主订单的状态
      const allSubOrders = await db.subOrder.findMany({
        where: { orderId: subOrder.orderId },
        include: { production: true },
      });
      
      let allCompleted = true;
      for (const so of allSubOrders) {
        const soProduction = so.production || [];
        const soTotalProduced = soProduction.reduce((sum, p) => sum + p.quantity, 0);
        if (soTotalProduced < so.plannedQuantity) {
          allCompleted = false;
          break;
        }
      }
      
      if (allCompleted) {
        // 如果所有子订单都已完成生产，更新主订单状态
        await db.order.update({
          where: { id: subOrder.orderId },
          data: { status: "COMPLETED" },
        });
      } else if (subOrder.order.status !== "IN_PRODUCTION") {
        // 至少有一个子订单在生产中
        await db.order.update({
          where: { id: subOrder.orderId },
          data: { status: "IN_PRODUCTION" },
        });
      }
    } else if (subOrder.order.status === "CONFIRMED") {
      // 开始生产时，将订单状态更新为生产中
      await db.order.update({
        where: { id: subOrder.orderId },
        data: { status: "IN_PRODUCTION" },
      });
    }

    // 记录审计日志
    await db.auditLog.create({
      data: {
        userId,
        action: "CREATE",
        resource: "PRODUCTION",
        resourceId: subOrder.id,
        description: `创建了订单 ${subOrder.order.orderNumber} 的生产记录，数量: ${values.quantity}`,
      },
    });

    revalidatePath("/dashboard/production");
    return { success: true };
  } catch (error) {
    console.error("创建生产记录失败:", error);
    return { error: "创建生产记录失败" };
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
    let dbStatus;
    if (values.status === "COMPLETED") {
      dbStatus = "FINISHED";
    } else if (values.status === "PAUSED") {
      dbStatus = "NOT_STARTED"; // 或其他合适的值
    } else {
      dbStatus = values.status; // NOT_STARTED 或 IN_PROGRESS 不需要映射
    }

    // 更新生产记录
    await db.production.update({
      where: { id },
      data: {
        status: dbStatus as ProductionStatus,
        team: values.team,
        shift: values.shift,
        quantity: values.quantity,
        startTime: values.startTime ? new Date(values.startTime) : null,
        endTime: values.endTime ? new Date(values.endTime) : null,
        notes: values.notes,
      },
    });

    // 记录审计日志
    await db.auditLog.create({
      data: {
        userId,
        action: "UPDATE",
        resource: "PRODUCTION",
        resourceId: id,
        description: `更新了订单 ${subOrder.order.orderNumber} 的生产记录，数量: ${values.quantity}`,
      },
    });

    revalidatePath("/dashboard/production");
    revalidatePath(`/dashboard/production/${id}`);
    return { success: true };
  } catch (error) {
    console.error("更新生产记录失败:", error);
    return { error: "更新生产记录失败" };
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