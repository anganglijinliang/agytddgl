import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }
  
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
} 