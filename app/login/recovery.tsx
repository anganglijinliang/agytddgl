"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export function LoginRecovery() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [cookies, setCookies] = useState<string[]>([]);

  useEffect(() => {
    // 解析错误类型
    const errorType = searchParams?.get("error");
    
    if (errorType === "redirect_loop") {
      setError("检测到无限重定向循环。可能是因为数据库连接失败或认证服务不可用。");
    } else if (errorType === "auth") {
      setError("认证失败，请尝试清除浏览器Cookie后重试。");
    } else if (errorType) {
      setError(`登录发生错误：${errorType}`);
    }
    
    // 获取当前的Cookie (只在浏览器上执行)
    if (typeof document !== 'undefined') {
      setCookies(document.cookie.split(';').map(c => c.trim()));
    }
  }, [searchParams]);

  // 清除所有Cookie并重定向到登录页
  const handleClearAndLogin = () => {
    // 清除所有可能的认证相关的Cookie
    const cookiesToClear = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url',
      'next-auth.csrf-token',
      '__Secure-next-auth.csrf-token',
      'auth-token'
    ];
    
    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}; secure; samesite=lax`;
    });
    
    // 重定向到登录页
    router.push('/login?cleared=1');
  };
  
  // 访问静态仪表盘
  const handleViewStaticDashboard = () => {
    router.push('/static-dashboard');
  };
  
  // 返回首页
  const handleGoHome = () => {
    router.push('/');
  };

  // 如果没有错误，不显示恢复界面
  if (!error) return null;

  return (
    <Card className="w-full max-w-md mx-auto mt-4 border-red-200 shadow-lg">
      <CardHeader className="bg-red-50 border-b border-red-100">
        <CardTitle className="text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          登录异常
        </CardTitle>
        <CardDescription>
          系统检测到登录异常，请尝试以下恢复操作
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>错误信息</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <div className="space-y-2 mt-4">
          <h3 className="text-sm font-medium">可能的原因：</h3>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>数据库连接问题</li>
            <li>身份验证服务暂时不可用</li>
            <li>Cookie数据已损坏</li>
            <li>会话过期但未正确清除</li>
          </ul>
        </div>
        
        {cookies.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-1">当前Cookie:</h3>
            <div className="bg-gray-50 p-2 rounded text-xs font-mono overflow-auto max-h-[100px]">
              {cookies.map((cookie, i) => (
                <div key={i} className="truncate">{cookie}</div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button 
          variant="destructive" 
          className="w-full" 
          onClick={handleClearAndLogin}
        >
          清除所有会话数据并重新登录
        </Button>
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleViewStaticDashboard}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          查看静态仪表盘
        </Button>
        <Button 
          variant="ghost" 
          className="w-full" 
          onClick={handleGoHome}
        >
          <Home className="h-4 w-4 mr-2" />
          返回首页
        </Button>
      </CardFooter>
    </Card>
  );
} 