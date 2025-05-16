"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function DashboardClient() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 如果会话加载完成且未认证，重定向到登录页
    if (status === "unauthenticated") {
      console.log("Dashboard Client: 未检测到会话，重定向到登录页");
      router.push("/login");
    } else if (status === "authenticated") {
      // 加载完成，允许显示内容
      setIsLoading(false);
    }
  }, [status, router]);

  // 处理加载状态
  if (status === "loading" || isLoading) {
    return <div className="p-8 text-center">正在验证身份...</div>;
  }

  // 如果会话未加载完成或未认证，显示空内容等待重定向
  if (!session?.user) {
    return null;
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