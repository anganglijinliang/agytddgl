import { Metadata } from "next";
import { DashboardClient } from "./dashboard-client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "仪表盘 | 安钢集团永通球墨铸铁管有限责任公司",
  description: "系统仪表盘，查看关键统计数据和待办事项",
};

// 避免缓存造成问题
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  console.log("服务器端渲染DashboardPage");
  
  // 验证用户是否已登录
  let session;
  try {
    session = await auth();
    console.log("用户认证状态:", session ? "已登录" : "未登录");
    
    if (!session?.user?.id) {
      console.log("未登录用户尝试访问仪表盘，重定向到登录页");
      redirect("/login");
    }
  } catch (authError) {
    console.error("验证用户身份时出错:", authError);
    redirect("/login?error=auth");
  }
  
  // 获取用户信息
  try {
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
      console.log("找不到用户，重定向到登录页");
      redirect("/login");
    }
    
    console.log("成功获取用户信息:", user.email);
  } catch (userError) {
    console.error("获取用户信息失败:", userError);
    // 不直接重定向，让客户端组件处理
  }
  
  // 获取订单统计数据
  let orderStatistics;
  try {
    orderStatistics = await getOrderStatistics();
    console.log("成功获取订单统计数据");
  } catch (error) {
    console.error("获取订单统计数据失败:", error);
    // 使用空数据，让客户端处理
    orderStatistics = {
      totalOrders: 0,
      inProduction: 0,
      pendingShipment: 0,
      completed: 0,
    };
  }
  
  return (
    <Suspense fallback={<div className="p-8 text-center">正在加载仪表盘...</div>}>
      <DashboardClient initialData={orderStatistics} />
    </Suspense>
  );
}

// 获取订单统计数据
async function getOrderStatistics() {
  try {
    console.log("开始查询订单统计数据");
    // 先测试数据库连接
    await db.$queryRaw`SELECT 1`;
    
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
    console.error("获取订单统计数据失败，数据库查询出错:", error);
    throw error;
  }
} 