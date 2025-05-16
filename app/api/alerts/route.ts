import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDays, isAfter, isBefore, parseISO } from "date-fns";

/**
 * GET /api/alerts
 * 获取用户相关的提醒数据
 */
export async function GET(req: Request) {
  try {
    // 验证用户身份
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("未授权", { status: 401 });
    }
    
    const userId = session.user.id;
    
    // 获取用户
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    });
    
    if (!user) {
      return new NextResponse("未找到用户", { status: 404 });
    }
    
    // 生成提醒列表
    const alerts = await generateAlerts(user);
    
    return NextResponse.json(alerts);
  } catch (error) {
    console.error("获取提醒出错:", error);
    return new NextResponse("服务器内部错误", { status: 500 });
  }
}

/**
 * 生成用户提醒列表
 */
async function generateAlerts(user: { id: string, role: string }) {
  const now = new Date();
  const alerts = [];
  
  // 查询未读通知
  const notifications = await db.notification.findMany({
    where: {
      userId: user.id,
      read: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });
  
  // 将通知转换为提醒
  for (const notification of notifications) {
    alerts.push({
      id: notification.id,
      type: notification.type === "URGENT" ? "urgent" : 
            notification.type === "WARNING" ? "warning" : "info",
      title: notification.title,
      description: notification.message,
      link: notification.linkUrl || undefined,
      date: notification.createdAt,
      priority: notification.type === "URGENT" ? 100 : 
               notification.type === "WARNING" ? 80 : 60,
      isNew: true,
    });
  }
  
  // 查询紧急订单
  // 仅包含有权限查看的角色
  if (["SUPER_ADMIN", "ADMIN", "ORDER_SPECIALIST", "PRODUCTION_STAFF"].includes(user.role)) {
    const urgentOrders = await db.order.findMany({
      where: {
        OR: [
          { status: "CONFIRMED" },
          { status: "IN_PRODUCTION" },
        ],
        subOrders: {
          some: {
            OR: [
              { priorityLevel: "URGENT" },
              { priorityLevel: "CRITICAL" },
            ],
          },
        },
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        subOrders: {
          where: {
            OR: [
              { priorityLevel: "URGENT" },
              { priorityLevel: "CRITICAL" },
            ],
          },
          select: {
            specification: true,
            plannedQuantity: true,
            priorityLevel: true,
            deliveryDate: true,
          },
        },
      },
      take: 10,
    });
    
    // 将紧急订单转换为提醒
    for (const order of urgentOrders) {
      alerts.push({
        id: `urgent-order-${order.id}`,
        type: "urgent",
        title: `紧急订单: ${order.orderNumber}`,
        description: `客户 ${order.customer.name} 的紧急订单需要处理，包含 ${order.subOrders.length} 个紧急子订单`,
        link: `/dashboard/orders/${order.id}`,
        date: new Date(), // 当前日期，表示立即需要处理
        priority: 95,
        isNew: false,
      });
    }
  }
  
  // 查询临近交期的订单
  // 仅包含有权限查看的角色
  if (["SUPER_ADMIN", "ADMIN", "ORDER_SPECIALIST", "SHIPPING_STAFF"].includes(user.role)) {
    // 修改查询方式，避免使用跨表字段引用
    const subOrdersWithShipping = await db.subOrder.findMany({
      where: {
        deliveryDate: {
          lte: addDays(now, 7), // 7天内需要交付的订单
        },
        order: {
          status: {
            in: ["CONFIRMED", "IN_PRODUCTION", "PARTIALLY_SHIPPED"],
          },
        },
      },
      include: {
        order: {
          include: {
            customer: true,
          },
        },
        shipping: true,
      },
    });
    
    // 筛选出未完全发货的子订单
    const incompleteSubOrders = subOrdersWithShipping.filter(subOrder => {
      const totalShipped = subOrder.shipping.reduce((sum, s) => sum + s.quantity, 0);
      return totalShipped < subOrder.plannedQuantity;
    });
    
    // 根据订单ID分组
    const orderMap = new Map<string, {
      id: string;
      orderNumber: string;
      customer: { name: string };
      subOrders: Array<typeof incompleteSubOrders[0]>;
    }>();
    
    for (const subOrder of incompleteSubOrders) {
      if (!orderMap.has(subOrder.orderId)) {
        orderMap.set(subOrder.orderId, {
          id: subOrder.orderId,
          orderNumber: subOrder.order.orderNumber,
          customer: subOrder.order.customer,
          subOrders: [],
        });
      }
      orderMap.get(subOrder.orderId)?.subOrders.push(subOrder);
    }
    
    // 将临近交期订单转换为提醒
    // 使用Array.from转换Map.entries()为数组再迭代
    Array.from(orderMap.entries()).forEach(([orderId, order]) => {
      // 找出最近的交期日期
      let earliestDate = new Date();
      earliestDate.setFullYear(earliestDate.getFullYear() + 1); // 设置一个将来的日期
      
      for (const subOrder of order.subOrders) {
        if (isBefore(subOrder.deliveryDate, earliestDate)) {
          earliestDate = subOrder.deliveryDate;
        }
      }
      
      // 计算未完成数量
      const total = order.subOrders.reduce((sum: number, so) => sum + so.plannedQuantity, 0);
      const shipped = order.subOrders.reduce((sum: number, so) => {
        return sum + so.shipping.reduce((shipSum: number, s) => shipSum + s.quantity, 0);
      }, 0);
      const remaining = total - shipped;
      
      // 根据交期紧急程度确定类型和优先级
      const daysUntilDelivery = Math.ceil((earliestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      let alertType = "deadline";
      let priority = 70;
      
      if (daysUntilDelivery <= 2) {
        alertType = "urgent";
        priority = 90;
      } else if (daysUntilDelivery <= 4) {
        priority = 80;
      }
      
      alerts.push({
        id: `deadline-order-${orderId}`,
        type: alertType,
        title: `交期临近: ${order.orderNumber}`,
        description: `客户 ${order.customer.name} 的订单还有 ${daysUntilDelivery} 天到期，还剩 ${remaining} 支未发运`,
        link: `/dashboard/orders/${orderId}`,
        date: earliestDate,
        priority,
        isNew: false,
      });
    });
  }
  
  // 查询生产延误信息
  // 仅包含有权限查看的角色
  if (["SUPER_ADMIN", "ADMIN", "PRODUCTION_STAFF"].includes(user.role)) {
    // 修改查询方式，避免字段引用和进度计算问题
    const subOrdersWithProduction = await db.subOrder.findMany({
      where: {
        deliveryDate: {
          lte: addDays(now, 10), // 10天内需要交付
        },
        order: {
          status: {
            in: ["CONFIRMED", "IN_PRODUCTION"],
          },
        },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customer: {
              select: {
                name: true,
              },
            },
          },
        },
        production: {
          select: {
            quantity: true,
          },
        },
      },
      take: 10,
    });
    
    // 筛选出生产进度不足的子订单
    const delayedProductions = subOrdersWithProduction.filter(subOrder => {
      const totalProduced = subOrder.production.reduce((sum: number, p) => sum + p.quantity, 0);
      const productionPercentage = (totalProduced / subOrder.plannedQuantity) * 100;
      return productionPercentage < 50; // 生产进度不足50%
    });
    
    // 将生产延误转换为提醒
    for (const subOrder of delayedProductions) {
      // 计算生产进度
      const produced = subOrder.production.reduce((sum: number, p) => sum + p.quantity, 0);
      const productionPercentage = Math.round((produced / subOrder.plannedQuantity) * 100);
      
      alerts.push({
        id: `production-delay-${subOrder.id}`,
        type: "warning",
        title: `生产延误: ${subOrder.order.orderNumber}`,
        description: `规格 ${subOrder.specification} 的生产进度仅为 ${productionPercentage}%，交期临近`,
        link: `/dashboard/production?subOrderId=${subOrder.id}`,
        date: subOrder.deliveryDate,
        priority: 85,
        isNew: false,
      });
    }
  }
  
  // 按优先级排序
  return alerts.sort((a, b) => b.priority - a.priority);
} 