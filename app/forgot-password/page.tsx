"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      // 在实际环境中，这里应该调用API来处理密码重置请求
      // 目前仅显示成功消息作为示例
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitted(true);
      toast.success("密码重置链接已发送到您的邮箱");
    } catch (error) {
      console.error(error);
      toast.error("发送密码重置链接失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-50 to-blue-100 p-4">
      <div className="w-full max-w-md">
        <Card className="border-none shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-center text-2xl font-bold">找回密码</CardTitle>
            <CardDescription className="text-center">
              {!submitted 
                ? "请输入您的邮箱地址，我们将发送密码重置链接给您"
                : "密码重置链接已发送，请查看您的邮箱"
              }
            </CardDescription>
          </CardHeader>
          {!submitted ? (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none" htmlFor="email">
                    邮箱
                  </label>
                  <Input
                    id="email"
                    placeholder="请输入您的邮箱地址"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button 
                  className="w-full bg-brand-600 hover:bg-brand-700" 
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "发送中..." : "发送重置链接"}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  asChild
                >
                  <Link href="/login">返回登录</Link>
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="space-y-4">
              <p className="text-center text-sm text-gray-600">
                密码重置链接已发送到 {email}。请检查您的邮箱并按照邮件中的指示操作。
              </p>
              <div className="pt-4">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  asChild
                >
                  <Link href="/login">返回登录</Link>
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </main>
  );
} 