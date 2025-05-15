import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Database, RefreshCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DatabaseMigrationForm } from "./components/database-migration-form";
import { UserRole } from "@/types";

export default async function DatabaseSettingsPage() {
  const session = await auth();
  
  // 检查是否为管理员
  if (!session?.user || ![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(session.user.role as UserRole)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading title="数据库管理" description="管理系统数据库设置和迁移" />
        </div>
        <Separator />
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>注意</AlertTitle>
          <AlertDescription>
            数据库管理功能仅供管理员使用。请确保在操作前备份数据库，以防数据丢失。
          </AlertDescription>
        </Alert>
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                数据库状态
              </CardTitle>
              <CardDescription>
                查看当前数据库连接状态和版本信息
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">连接状态</p>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <p className="text-sm">已连接</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">环境</p>
                    <p className="text-sm">{process.env.NODE_ENV}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">提供商</p>
                    <p className="text-sm">PostgreSQL</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">迁移状态</p>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <p className="text-sm">最新</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="gap-1">
                <RefreshCcw className="h-4 w-4" />
                刷新状态
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>数据库迁移</CardTitle>
              <CardDescription>
                管理数据库架构迁移
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DatabaseMigrationForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 