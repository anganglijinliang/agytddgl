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
      link: notification.link || undefined,
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
    const deliveryDateOrders = await db.order.findMany({
      where: {
        status: {
          in: ["CONFIRMED", "IN_PRODUCTION", "PARTIALLY_SHIPPED"],
        },
        subOrders: {
          some: {
            deliveryDate: {
              lte: addDays(now, 7), // 7天内需要交付的订单
            },
            // 排除已经完全发运的子订单
            shipping: {
              every: {
                NOT: {
                  quantity: {
                    gte: db.subOrder.fields.plannedQuantity,
                  },
                },
              },
            },
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
            deliveryDate: {
              lte: addDays(now, 7),
            },
          },
          select: {
            id: true,
            specification: true,
            plannedQuantity: true,
            deliveryDate: true,
            shipping: {
              select: {
                quantity: true,
              },
            },
          },
        },
      },
      take: 10,
    });
    
    // 将临近交期订单转换为提醒
    for (const order of deliveryDateOrders) {
      // 找出最近的交期日期
      let earliestDate = new Date();
      earliestDate.setFullYear(earliestDate.getFullYear() + 1); // 设置一个将来的日期
      
      for (const subOrder of order.subOrders) {
        if (isBefore(subOrder.deliveryDate, earliestDate)) {
          earliestDate = subOrder.deliveryDate;
        }
      }
      
      // 计算未完成数量
      const total = order.subOrders.reduce((sum, so) => sum + so.plannedQuantity, 0);
      const shipped = order.subOrders.reduce((sum, so) => {
        return sum + so.shipping.reduce((shipSum, s) => shipSum + s.quantity, 0);
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
        id: `deadline-order-${order.id}`,
        type: alertType,
        title: `交期临近: ${order.orderNumber}`,
        description: `客户 ${order.customer.name} 的订单还有 ${daysUntilDelivery} 天到期，还剩 ${remaining} 支未发运`,
        link: `/dashboard/orders/${order.id}`,
        date: earliestDate,
        priority,
        isNew: false,
      });
    }
  }
  
  // 查询生产延误信息
  // 仅包含有权限查看的角色
  if (["SUPER_ADMIN", "ADMIN", "PRODUCTION_STAFF"].includes(user.role)) {
    const delayedProductions = await db.subOrder.findMany({
      where: {
        order: {
          status: {
            in: ["CONFIRMED", "IN_PRODUCTION"],
          },
        },
        // 查找交期临近但生产进度不足的子订单
        deliveryDate: {
          lte: addDays(now, 10), // 10天内需要交付
        },
        production: {
          // 检查生产进度
          _sum: {
            quantity: {
              lt: 0.5, // 生产进度不足50%
            },
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
    
    // 将生产延误转换为提醒
    for (const subOrder of delayedProductions) {
      // 计算生产进度
      const produced = subOrder.production.reduce((sum, p) => sum + p.quantity, 0);
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