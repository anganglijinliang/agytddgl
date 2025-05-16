import { Metadata } from "next";
import { DashboardClient } from "./dashboard-client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "仪表盘 | 安钢集团永通球墨铸铁管有限责任公司",
  description: "系统仪表盘，查看关键统计数据和待办事项",
};

export default async function DashboardPage() {
  // 验证用户是否已登录
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }
  
  // 获取用户信息
  const user = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
  
  if (!user) {
    redirect("/login");
  }
  
  // 获取简略的统计数据（详细统计将在客户端获取）
  const orderStatistics = await getOrderStatistics();
  
  return <DashboardClient initialData={orderStatistics} />;
}

// 获取订单统计数据
async function getOrderStatistics() {
  try {
    // 获取订单总数
    const totalOrders = await db.order.count();
    
    // 获取生产中订单数
    const inProduction = await db.order.count({
      where: {
        status: "IN_PRODUCTION",
      },
    });
    
    // 获取待发运或部分发运订单数
    const pendingShipment = await db.order.count({
      where: {
        OR: [
          { status: "IN_PRODUCTION" },
          { status: "PARTIALLY_SHIPPED" },
        ],
      },
    });
    
    // 获取已完成订单数
    const completed = await db.order.count({
      where: {
        status: "COMPLETED",
      },
    });
    
    return {
      totalOrders,
      inProduction,
      pendingShipment,
      completed,
    };
  } catch (error) {
    console.error("获取订单统计数据失败:", error);
    return {
      totalOrders: 0,
      inProduction: 0,
      pendingShipment: 0,
      completed: 0,
    };
  }
} 