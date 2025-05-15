"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function TestLoginPage() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Admin123!");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError("");

    try {
      console.log(`尝试登录测试用户: ${email}`);
      
      const response = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      
      console.log("登录响应:", response);
      setResult(response);
      
      if (!response?.ok) {
        setError(response?.error || "未知错误");
      }
    } catch (err) {
      console.error("登录异常:", err);
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">登录测试页面</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">邮箱</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="邮箱"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">密码</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码"
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "登录中..." : "测试登录"}
            </Button>
          </form>
          
          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
              错误: {error}
            </div>
          )}
          
          {result && (
            <div className="mt-4 space-y-2">
              <h3 className="font-medium">登录结果:</h3>
              <pre className="overflow-auto rounded-md bg-gray-100 p-2 text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm text-blue-600">
            <p>请使用 admin@example.com / Admin123! 测试登录</p>
            <p className="mt-1">如果登录成功，响应中会包含 ok: true</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 