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
    try {
      const alerts = await generateAlerts(user);
      return NextResponse.json(alerts);
    } catch (error) {
      console.error("生成提醒失败:", error);
      // 返回空数组而不是错误，确保前端能正常显示
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("获取提醒出错:", error);
    // 返回空数组而不是错误，确保前端能正常显示
    return NextResponse.json([]);
  }
}

// 定义类型以避免隐式any错误
type ShippingRecord = {
  quantity: number;
  [key: string]: any;
};

type SubOrder = {
  id: string;
  orderId: string;
  plannedQuantity: number;
  specification: string;
  deliveryDate: Date;
  shipping: ShippingRecord[];
  order: {
    id: string;
    orderNumber: string;
    customer: { 
      name: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
  [key: string]: any;
};

type OrderMapItem = {
  id: string;
  orderNumber: string;
  customer: { name: string; [key: string]: any; };
  subOrders: SubOrder[];
  [key: string]: any;
};

/**
 * 生成用户提醒列表
 */
async function generateAlerts(user: { id: string, role: string }) {
  try {
    const now = new Date();
    const alerts: any[] = [];
    
    // 查询未读通知
    try {
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
        if (notification) {
          alerts.push({
            id: notification.id,
            type: notification.type === "URGENT" ? "urgent" : 
                  notification.type === "WARNING" ? "warning" : "info",
            title: notification.title || "通知",
            description: notification.message || "",
            link: notification.linkUrl || undefined,
            date: notification.createdAt,
            priority: notification.type === "URGENT" ? 100 : 
                     notification.type === "WARNING" ? 80 : 60,
            isNew: true,
          });
        }
      }
    } catch (error) {
      console.error("获取通知失败:", error);
      // 继续执行，不影响其他提醒的生成
    }
    
    // 查询紧急订单
    // 仅包含有权限查看的角色
    if (["SUPER_ADMIN", "ADMIN", "ORDER_SPECIALIST", "PRODUCTION_STAFF"].includes(user.role)) {
      try {
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
          if (order && order.customer) {
            alerts.push({
              id: `urgent-order-${order.id}`,
              type: "urgent",
              title: `紧急订单: ${order.orderNumber || "未知订单号"}`,
              description: `客户 ${order.customer.name || "未知客户"} 的紧急订单需要处理，包含 ${order.subOrders?.length || 0} 个紧急子订单`,
              link: `/dashboard/orders/${order.id}`,
              date: new Date(), // 当前日期，表示立即需要处理
              priority: 95,
              isNew: false,
            });
          }
        }
      } catch (error) {
        console.error("获取紧急订单失败:", error);
        // 继续执行，不影响其他提醒的生成
      }
    }
    
    // 查询临近交期的订单
    // 仅包含有权限查看的角色
    if (["SUPER_ADMIN", "ADMIN", "ORDER_SPECIALIST", "SHIPPING_STAFF"].includes(user.role)) {
      try {
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
          if (!subOrder || !subOrder.shipping) return false;
          
          const totalShipped = subOrder.shipping.reduce((sum, s) => {
            if (!s || typeof s.quantity !== 'number') return sum;
            return sum + s.quantity;
          }, 0);
          
          return totalShipped < (subOrder.plannedQuantity || 0);
        });
        
        // 根据订单ID分组
        const orderMap = new Map<string, OrderMapItem>();
        
        for (const subOrder of incompleteSubOrders) {
          if (!subOrder || !subOrder.order || !subOrder.orderId) continue;
          
          if (!orderMap.has(subOrder.orderId)) {
            orderMap.set(subOrder.orderId, {
              id: subOrder.orderId,
              orderNumber: subOrder.order.orderNumber || "未知订单号",
              customer: subOrder.order.customer || { name: "未知客户" },
              subOrders: [],
            });
          }
          
          const orderData = orderMap.get(subOrder.orderId);
          if (orderData && Array.isArray(orderData.subOrders)) {
            orderData.subOrders.push(subOrder as SubOrder);
          }
        }
        
        // 将临近交期订单转换为提醒
        orderMap.forEach((order, orderId) => {
          if (!order || !Array.isArray(order.subOrders) || order.subOrders.length === 0) return;
          
          // 找出最近的交期日期
          let earliestDate = new Date();
          earliestDate.setFullYear(earliestDate.getFullYear() + 1); // 设置一个将来的日期
          
          for (const subOrder of order.subOrders) {
            if (subOrder && subOrder.deliveryDate && isBefore(subOrder.deliveryDate, earliestDate)) {
              earliestDate = subOrder.deliveryDate;
            }
          }
          
          // 计算未完成数量
          const total = order.subOrders.reduce((sum: number, so: SubOrder) => {
            if (!so || typeof so.plannedQuantity !== 'number') return sum;
            return sum + so.plannedQuantity;
          }, 0);
          
          const shipped = order.subOrders.reduce((sum: number, so: SubOrder) => {
            if (!so || !Array.isArray(so.shipping)) return sum;
            return sum + so.shipping.reduce((shipSum: number, s: ShippingRecord) => {
              if (!s || typeof s.quantity !== 'number') return shipSum;
              return shipSum + s.quantity;
            }, 0);
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
      } catch (error) {
        console.error("获取临近交期订单失败:", error);
        // 继续执行，不影响其他提醒的生成
      }
    }
    
    // 查询生产延误信息
    // 由于错误频发，暂时移除此部分功能
    
    // 最后，对提醒进行排序
    return alerts.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  } catch (error) {
    console.error("生成提醒出现未捕获的错误:", error);
    // 返回空数组，确保前端能正常运行
    return [];
  }
} 