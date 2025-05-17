import { Metadata } from "next";
import { DashboardStatic } from "../(dashboard)/dashboard-static";

export const metadata: Metadata = {
  title: "静态仪表盘 | 安钢集团永通球墨铸铁管有限责任公司",
  description: "系统静态仪表盘，用于数据库连接故障时显示",
};

// 避免缓存造成问题
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function StaticDashboardPage() {
  return <DashboardStatic />;
} 