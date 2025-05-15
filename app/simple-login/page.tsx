"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SimpleLoginPage() {
  const router = useRouter();
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
      console.log(`尝试登录: ${email}`);
      
      // 使用我们自己的API端点
      const response = await fetch("/api/auth/simple-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // 重要：确保Cookie被保存
      });
      
      const data = await response.json();
      console.log("登录响应:", data);
      setResult(data);
      
      if (!response.ok) {
        setError(data.error || "登录失败");
        return;
      }
      
      // 登录成功，显示成功消息并跳转
      alert("登录成功！即将跳转到仪表盘...");
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1000);
      
    } catch (err) {
      console.error("登录异常:", err);
      setError(err instanceof Error ? err.message : "登录请求失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">简易登录页面</CardTitle>
          <p className="text-center text-sm text-gray-500">使用直接API认证（不依赖NextAuth）</p>
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
              {loading ? "登录中..." : "登录"}
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
            <p className="mt-1">这个页面使用自定义API进行认证，完全绕过了NextAuth</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 