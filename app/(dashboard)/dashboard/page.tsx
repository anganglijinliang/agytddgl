import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
  try {
    // 获取当前会话
    const session = await auth();
    
    // 如果没有登录，重定向到登录页面
    if (!session?.user) {
      console.log("Dashboard: 未检测到会话，重定向到登录页");
      redirect("/login");
    }
    
    console.log("Dashboard: 用户已认证，显示仪表盘", {
      user: session.user.email || session.user.name || "未知用户",
      role: session.user.role || "未知角色"
    });
    
    return (
      <div className="space-y-6">
        <Heading
          title="欢迎使用安钢球墨铸铁管订单管理系统"
          description={`你好，${session.user.name || session.user.email}，请从左侧菜单选择功能。`}
        />
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>订单管理</CardTitle>
              <CardDescription>管理所有客户订单</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/orders">
                <Button>查看订单</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>生产管理</CardTitle>
              <CardDescription>管理生产计划与进度</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/production">
                <Button>查看生产</Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>发货管理</CardTitle>
              <CardDescription>管理订单发货与物流</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/shipping">
                <Button>查看发货</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Dashboard页面加载出错:", error);
    // 如果发生错误，显示错误信息而非直接重定向
    // 这样有助于诊断问题
    return (
      <div className="p-4 bg-red-50 rounded-md">
        <h2 className="text-lg font-semibold text-red-700">加载仪表盘时出错</h2>
        <p className="text-red-600">请尝试重新登录或联系系统管理员</p>
        <div className="mt-4">
          <Link href="/login">
            <Button variant="outline">返回登录</Button>
          </Link>
        </div>
      </div>
    );
  }
} 