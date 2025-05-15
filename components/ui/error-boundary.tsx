"use client";

import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({
  error,
  reset,
}: ErrorBoundaryProps) {
  useEffect(() => {
    // 记录错误到错误监控服务
    console.error("应用程序错误:", error);
  }, [error]);

  const isPrismaError = error.message.includes("Prisma") || 
                       error.message.includes("prisma") || 
                       error.message.includes("database") ||
                       error.message.includes("数据库");

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Alert 
        variant="destructive" 
        className="max-w-2xl border-red-400"
      >
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="text-lg font-semibold">
          {isPrismaError ? "数据库连接错误" : "应用程序错误"}
        </AlertTitle>
        <AlertDescription className="mt-4">
          <div className="mb-4">
            {isPrismaError ? (
              <p>
                系统无法连接到数据库。请确保数据库配置正确，并且数据库服务器正在运行。
                如果问题持续存在，请联系系统管理员。
              </p>
            ) : (
              <p>
                应用程序遇到了一个问题: <span className="font-mono">{error.message}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={reset}>重试</Button>
            <Button variant="outline" onClick={() => window.location.href = "/"}>
              返回首页
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
} 