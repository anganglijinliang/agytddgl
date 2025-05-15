import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { differenceInDays } from "date-fns";
import { createDeliveryDateAlert, createInventoryAlert } from "@/app/(dashboard)/dashboard/notifications/actions";

// 设置为强制动态路由，解决静态生成问题
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const apiKey = req.headers.get("x-api-key");
    // 确保请求有有效的API密钥（生产环境中应使用环境变量）
    if (apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. 生成库存告警通知
    // 查找需要发货但库存不足的子订单
    const subOrdersWithLowInventory = await db.subOrder.findMany({
      where: {
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
        production: true,
        shipping: true,
      },
    });

    // 计算每个子订单的库存情况
    for (const subOrder of subOrdersWithLowInventory) {
      const totalProduced = (subOrder.production || []).reduce(
        (sum, p) => sum + p.quantity,
        0
      );
      const totalShipped = (subOrder.shipping || []).reduce(
        (sum, s) => sum + s.quantity,
        0
      );
      const inStock = totalProduced - totalShipped;
      const remaining = subOrder.plannedQuantity - totalShipped;
      
      // 如果库存不足且有未发货的数量
      if (inStock < remaining && remaining > 0) {
        // 查找订单管理人员和生产人员
        const users = await db.user.findMany({
          where: {
            OR: [
              { role: "SUPER_ADMIN" },
              { role: "ADMIN" },
              { role: "PRODUCTION_STAFF" },
              { role: "ORDER_SPECIALIST" },
            ],
          },
        });

        // 为每个相关用户创建通知
        for (const user of users) {
          await createInventoryAlert(
            user.id,
            subOrder.id,
            subOrder.order.orderNumber,
            subOrder.specification,
            remaining - inStock
          );
        }
      }
    }

    // 2. 生成交货日期告警通知
    // 查找临近交货日期的子订单
    const today = new Date();
    
    const upcomingDeliveries = await db.subOrder.findMany({
      where: {
        order: {
          status: {
            in: ["CONFIRMED", "IN_PRODUCTION", "PARTIALLY_SHIPPED"],
          },
        },
      },
      include: {
        order: true,
      },
    });

    // 计算距离交货日期的天数，并生成通知
    for (const subOrder of upcomingDeliveries) {
      const daysRemaining = differenceInDays(
        new Date(subOrder.deliveryDate),
        today
      );

      // 如果距离交货日期不到7天或者已经超期，创建通知
      if (daysRemaining <= 7 && daysRemaining >= -3) {
        // 查找订单管理人员
        const users = await db.user.findMany({
          where: {
            OR: [
              { role: "SUPER_ADMIN" },
              { role: "ADMIN" },
              { role: "ORDER_SPECIALIST" },
            ],
          },
        });

        // 为每个相关用户创建通知
        for (const user of users) {
          await createDeliveryDateAlert(
            user.id,
            subOrder.id,
            subOrder.order.orderNumber,
            subOrder.specification,
            daysRemaining
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("自动通知生成失败:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 