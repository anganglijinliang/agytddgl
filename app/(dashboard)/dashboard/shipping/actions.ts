"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ShippingWithDetails } from "@/types/extended-types";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TransportationType } from "@prisma/client";
import { z } from "zod";

// 获取所有发货记录
export async function getShippings(): Promise<ShippingWithDetails[]> {
  try {
    const shippings = await db.shipping.findMany({
      include: {
        user: true,
        subOrder: {
          include: {
            order: {
              include: {
                customer: true,
              },
            },
            warehouse: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return shippings as ShippingWithDetails[];
  } catch (error) {
    console.error("获取发货记录失败:", error);
    throw new Error("获取发货记录失败");
  }
}

// 获取单个发货记录
export async function getShipping(id: string): Promise<ShippingWithDetails | null> {
  try {
    const shipping = await db.shipping.findUnique({
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
            warehouse: true,
          },
        },
      },
    });

    return shipping as ShippingWithDetails;
  } catch (error) {
    console.error("获取发货记录详情失败:", error);
    throw new Error("获取发货记录详情失败");
  }
}

const shippingFormSchema = z.object({
  subOrderId: z.string().min(1, "订单项目为必填项"),
  quantity: z.coerce.number().min(1, "数量必须大于0"),
  shippingDate: z.string(),
  transportType: z.nativeEnum(TransportationType),
  shippingNumber: z.string().optional(),
  destinationInfo: z.string().min(1, "目的地地址为必填项"),
  driverInfo: z.string().min(1, "司机信息为必填项"),
  vehicleInfo: z.string().min(1, "车辆信息为必填项"),
  notes: z.string().optional(),
});

export type ShippingFormValues = z.infer<typeof shippingFormSchema>;

// 创建发货记录
export async function createShipping(values: ShippingFormValues) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      redirect("/login");
    }

    const result = shippingFormSchema.safeParse(values);
    
    if (!result.success) {
      return { error: "表单数据验证失败" };
    }

    // 获取子订单信息
    const subOrder = await db.subOrder.findUnique({
      where: { id: values.subOrderId },
      include: {
        order: true,
        shipping: true,
        production: true,
      },
    });

    if (!subOrder) {
      return { error: "订单项目不存在" };
    }

    // 计算已发货数量
    const existingShipping = subOrder.shipping || [];
    const totalShipped = existingShipping.reduce((sum, s) => sum + s.quantity, 0);
    
    // 计算已生产数量
    const production = subOrder.production || [];
    const totalProduced = production.reduce((sum, p) => sum + p.quantity, 0);
    
    // 检查发货数量是否超出已生产数量
    if (values.quantity > totalProduced - totalShipped) {
      return { error: `发货数量超过已生产数量，剩余可发货: ${totalProduced - totalShipped}` };
    }

    // 创建发货记录
    await db.shipping.create({
      data: {
        quantity: values.quantity,
        shippingDate: new Date(values.shippingDate),
        transportType: values.transportType,
        shippingNumber: values.shippingNumber,
        destinationInfo: values.destinationInfo,
        driverInfo: values.driverInfo,
        vehicleInfo: values.vehicleInfo,
        notes: values.notes,
        userId,
        subOrderId: values.subOrderId,
        warehouseId: subOrder.warehouseId || "",
      },
    });

    // 检查是否需要更新订单状态
    const newTotalShipped = totalShipped + values.quantity;
    if (newTotalShipped >= subOrder.plannedQuantity) {
      // 如果全部发货完成，更新子订单的状态
      // 获取所有子订单的状态来决定主订单的状态
      const allSubOrders = await db.subOrder.findMany({
        where: { orderId: subOrder.orderId },
        include: { shipping: true },
      });
      
      let allShipped = true;
      for (const so of allSubOrders) {
        const soShipping = so.shipping || [];
        const soTotalShipped = soShipping.reduce((sum, s) => sum + s.quantity, 0);
        if (soTotalShipped < so.plannedQuantity) {
          allShipped = false;
          break;
        }
      }
      
      if (allShipped) {
        // 如果所有子订单都已完成发货，更新主订单状态
        await db.order.update({
          where: { id: subOrder.orderId },
          data: { status: "COMPLETED" },
        });
      } else if (subOrder.order.status !== "PARTIALLY_SHIPPED") {
        // 至少有一个子订单部分发货
        await db.order.update({
          where: { id: subOrder.orderId },
          data: { status: "PARTIALLY_SHIPPED" },
        });
      }
    } else if (subOrder.order.status !== "PARTIALLY_SHIPPED" && subOrder.order.status !== "COMPLETED") {
      // 部分发货时，将订单状态更新为部分发货
      await db.order.update({
        where: { id: subOrder.orderId },
        data: { status: "PARTIALLY_SHIPPED" },
      });
    }

    // 记录审计日志
    await db.auditLog.create({
      data: {
        userId,
        action: "CREATE",
        resource: "SHIPPING",
        resourceId: subOrder.id,
        description: `创建了订单 ${subOrder.order.orderNumber} 的发货记录，数量: ${values.quantity}`,
      },
    });

    revalidatePath("/dashboard/shipping");
    return { success: true };
  } catch (error) {
    console.error("创建发货记录失败:", error);
    return { error: "创建发货记录失败" };
  }
}

// 更新发货记录
export async function updateShipping(id: string, values: ShippingFormValues) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      redirect("/login");
    }

    const result = shippingFormSchema.safeParse(values);
    
    if (!result.success) {
      return { error: "表单数据验证失败" };
    }

    // 获取当前发货记录
    const currentShipping = await db.shipping.findUnique({
      where: { id },
      include: {
        subOrder: {
          include: {
            order: true,
            shipping: true,
            production: true,
          },
        },
      },
    });

    if (!currentShipping) {
      return { error: "发货记录不存在" };
    }

    // 计算已发货数量并检查是否超出计划
    const subOrder = currentShipping.subOrder;
    const existingShipping = subOrder.shipping || [];
    const totalShippedExcludingCurrent = existingShipping
      .filter(s => s.id !== id)
      .reduce((sum, s) => sum + s.quantity, 0);
    
    // 计算已生产数量
    const production = subOrder.production || [];
    const totalProduced = production.reduce((sum, p) => sum + p.quantity, 0);
    
    // 检查发货数量是否超出已生产数量
    if (values.quantity > totalProduced - totalShippedExcludingCurrent) {
      return { error: `发货数量超过已生产数量，剩余可发货: ${totalProduced - totalShippedExcludingCurrent}` };
    }

    // 更新发货记录
    await db.shipping.update({
      where: { id },
      data: {
        quantity: values.quantity,
        shippingDate: new Date(values.shippingDate),
        transportType: values.transportType,
        shippingNumber: values.shippingNumber,
        destinationInfo: values.destinationInfo,
        driverInfo: values.driverInfo,
        vehicleInfo: values.vehicleInfo,
        notes: values.notes,
      },
    });

    // 记录审计日志
    await db.auditLog.create({
      data: {
        userId,
        action: "UPDATE",
        resource: "SHIPPING",
        resourceId: id,
        description: `更新了订单 ${subOrder.order.orderNumber} 的发货记录，数量: ${values.quantity}`,
      },
    });

    revalidatePath("/dashboard/shipping");
    revalidatePath(`/dashboard/shipping/${id}`);
    return { success: true };
  } catch (error) {
    console.error("更新发货记录失败:", error);
    return { error: "更新发货记录失败" };
  }
}

// 删除发货记录
export async function deleteShipping(id: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      redirect("/login");
    }

    // 获取当前发货记录
    const shipping = await db.shipping.findUnique({
      where: { id },
      include: {
        subOrder: {
          include: {
            order: true,
          },
        },
      },
    });

    if (!shipping) {
      throw new Error("发货记录不存在");
    }

    // 删除发货记录
    await db.shipping.delete({
      where: { id },
    });

    // 记录审计日志
    await db.auditLog.create({
      data: {
        userId,
        action: "DELETE",
        resource: "SHIPPING",
        resourceId: id,
        description: `删除了订单 ${shipping.subOrder.order.orderNumber} 的发货记录`,
      },
    });

    revalidatePath("/dashboard/shipping");
    return { success: true };
  } catch (error) {
    console.error("删除发货记录失败:", error);
    throw new Error("删除发货记录失败");
  }
}

// 获取下拉选项数据
export async function getDropdownData() {
  try {
    // 获取所有有已生产记录但未完全发货的子订单
    const subOrders = await db.subOrder.findMany({
      where: {
        order: {
          status: {
            in: ["IN_PRODUCTION", "PARTIALLY_SHIPPED"],
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
        shipping: true,
      },
    });

    // 过滤出可以发货的子订单
    const availableSubOrders = subOrders.filter(subOrder => {
      const totalProduced = (subOrder.production || []).reduce(
        (sum, p) => sum + p.quantity, 
        0
      );
      const totalShipped = (subOrder.shipping || []).reduce(
        (sum, s) => sum + s.quantity, 
        0
      );
      // 只返回已生产但还未全部发货的子订单
      return totalProduced > totalShipped;
    }).map(so => {
      const totalProduced = (so.production || []).reduce(
        (sum, p) => sum + p.quantity, 
        0
      );
      const totalShipped = (so.shipping || []).reduce(
        (sum, s) => sum + s.quantity, 
        0
      );
      return {
        id: so.id,
        label: `${so.order.orderNumber} - ${so.order.customer.name} - ${so.specification} - 可发货:${totalProduced - totalShipped}`,
        produced: totalProduced,
        shipped: totalShipped,
        available: totalProduced - totalShipped,
      };
    });

    return { 
      subOrders: availableSubOrders,
    };
  } catch (error) {
    console.error("获取下拉选项数据失败:", error);
    throw new Error("获取下拉选项数据失败");
  }
} 