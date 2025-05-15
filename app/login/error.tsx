"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

// 包装在Suspense边界中的内容组件
function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");
  
  useEffect(() => {
    // 记录错误详情
    console.error("认证错误:", error);
  }, [error]);
  
  let errorMessage = "登录过程中发生了错误";
  
  if (error === "CredentialsSignin") {
    errorMessage = "登录凭据无效，请检查您的邮箱和密码";
  } else if (error === "AccessDenied") {
    errorMessage = "您没有访问权限";
  } else if (error === "Configuration") {
    errorMessage = "服务器配置错误，请联系管理员";
  } else if (error === "Verification") {
    errorMessage = "验证链接无效或已过期";
  } else if (error === "OAuthCallback") {
    errorMessage = "OAuth回调错误，请稍后再试";
  } else if (error === "OAuthAccountNotLinked") {
    errorMessage = "此邮箱已关联其他账号，请使用其他方式登录";
  } else if (error === "DatabaseConnectionError") {
    errorMessage = "数据库连接失败，请联系管理员";
  } else if (error === "AccountNotVerified") {
    errorMessage = "您的账号尚未验证，请查看邮箱或联系管理员";
  } else if (error === "AccountLocked") {
    errorMessage = "您的账号已被锁定，请联系管理员";
  } else if (error === "PasswordExpired") {
    errorMessage = "您的密码已过期，请重置密码";
  } else if (error === "ServerOffline") {
    errorMessage = "服务器暂时无法连接，请稍后再试";
  } else if (error) {
    errorMessage = `登录失败: ${error}`;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="h-5 w-5" />
          <CardTitle className="text-2xl">登录失败</CardTitle>
        </div>
        <CardDescription>
          很抱歉，登录过程中发生错误
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          {errorMessage}
        </div>
        
        <div className="flex flex-col space-y-2">
          <Button asChild>
            <Link href="/login">
              返回登录
            </Link>
          </Button>
          
          <Button variant="outline" asChild>
            <Link href="/">
              返回首页
            </Link>
          </Button>
          
          <Button variant="ghost" asChild className="text-sm">
            <Link href="/auth-debug">
              查看诊断信息
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// 顶层组件添加Suspense边界
export default function ErrorPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <Suspense fallback={<div className="p-4 text-center">加载中...</div>}>
        <ErrorContent />
      </Suspense>
    </div>
  );
} 