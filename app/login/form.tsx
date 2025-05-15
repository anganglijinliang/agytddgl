"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface LoginFormProps {
  error?: string;
}

export default function LoginForm({ error }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Admin123!");
  const [loginAttempts, setLoginAttempts] = useState(0);

  // 检查URL中是否有错误信息或者通过props传入的错误
  useEffect(() => {
    // 首先检查props传入的错误
    if (error) {
      setErrorMsg(getErrorMessage(error));
      return;
    }
    
    // 然后检查URL参数中的错误
    const errorFromUrl = searchParams?.get("error");
    if (errorFromUrl) {
      setErrorMsg(getErrorMessage(errorFromUrl));
    }
  }, [searchParams, error]);

  // 获取错误信息
  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "CredentialsSignin":
        return "登录凭据无效，请检查您的邮箱和密码";
      case "AccessDenied":
        return "您没有访问权限";
      case "Configuration":
        return "服务器配置错误，请联系管理员";
      default:
        return `登录失败: ${errorCode}`;
    }
  };
  
  // 处理登录逻辑
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setErrorMsg("");
      setLoginAttempts(prev => prev + 1);
      
      console.log(`尝试登录: ${email}, 尝试次数: ${loginAttempts + 1}, 时间: ${new Date().toISOString()}`);
      
      // 使用我们自定义的API端点
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        cache: "no-store"
      });
      
      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
        console.log("登录结果:", data);
      } catch (parseError) {
        console.error("解析响应失败:", parseError);
        throw new Error("服务器返回了无效的数据格式");
      }
      
      if (!response.ok) {
        // 处理各类错误
        let errorMessage = "登录失败";
        
        if (response.status === 401) {
          errorMessage = "用户名或密码错误";
        } else if (response.status === 500) {
          errorMessage = "服务器内部错误，请稍后再试";
        } else if (data?.error) {
          errorMessage = data.error;
        }
        
        setErrorMsg(errorMessage);
        toast.error(errorMessage);
        return;
      }
      
      // 登录成功
      toast.success("登录成功！");
      
      // 清除可能的错误状态
      setErrorMsg("");
      setLoginAttempts(0);
      
      // 延迟跳转
      setTimeout(() => {
        // 登录成功后直接跳转到固定路径
        console.log("登录成功，即将跳转到/dashboard");
        
        try {
          // 刷新路由避免可能的缓存问题
          router.refresh();
          // 使用replace而不是push进行重定向
          router.replace("/dashboard");
        } catch (routeError) {
          console.error("路由跳转失败:", routeError);
          // 备用方案：直接使用window.location
          window.location.href = "/dashboard";
        }
      }, 500);
    } catch (error) {
      console.error("登录过程中发生异常:", error);
      
      const errorMessage = error instanceof Error
        ? `登录失败: ${error.message}`
        : "登录过程中发生未知错误";
      
      setErrorMsg(errorMessage);
      toast.error(errorMessage);
      
      // 如果多次登录失败，提供更明确的提示
      if (loginAttempts >= 2) {
        toast.info("如遇持续问题，请查看诊断页面或联系管理员");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="space-y-1">
        <div className="flex justify-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-lock"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>
        <CardTitle className="text-center text-2xl font-bold">系统登录</CardTitle>
        <CardDescription className="text-center">
          登录到安钢集团永通球墨铸铁管订单管理系统
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          {errorMsg && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              邮箱
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入您的邮箱地址"
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" htmlFor="password">
                密码
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                忘记密码?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入您的密码"
                required
                autoComplete="current-password"
              />
              <button 
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "隐藏" : "显示"}
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              id="remember"
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label
              htmlFor="remember"
              className="text-sm text-gray-700"
            >
              记住我
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button 
            className="w-full"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "登录中..." : "登录"}
          </Button>
          
          <div className="p-2 bg-blue-50 rounded-md text-sm text-center">
            <strong>测试账号:</strong> admin@example.com / Admin123!
          </div>
          
          <div className="text-center text-sm">
            还没有账号?{" "}
            <Link
              href="/contact"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              联系管理员
            </Link>
          </div>
          
          <div className="text-center text-xs text-gray-500">
            遇到登录问题?{" "}
            <Link
              href="/auth-debug"
              className="text-blue-600 hover:underline"
            >
              查看诊断页面
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
} 