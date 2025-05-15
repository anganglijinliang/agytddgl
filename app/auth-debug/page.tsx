"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AuthDebugPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<string | null>(null);

  // 加载调试信息
  const loadDebugInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/debug-info");
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error("获取调试信息失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 重置认证状态
  const resetAuth = async () => {
    try {
      setLoading(true);
      setResetStatus("正在重置认证状态...");
      
      // 调用重置API
      const response = await fetch("/api/auth/reset-auth", {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResetStatus("认证状态已重置");
        
        // 调用NextAuth的登出
        await signOut({ redirect: false });
        
        // 重新加载页面
        window.location.reload();
      } else {
        setResetStatus(`重置失败: ${data.message}`);
      }
    } catch (error) {
      console.error("重置认证状态失败:", error);
      setResetStatus(`重置出错: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setLoading(false);
    }
  };

  // 页面加载时获取调试信息
  useEffect(() => {
    loadDebugInfo();
  }, []);

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">认证状态调试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* NextAuth 会话状态 */}
          <div className="rounded-md border p-4">
            <h2 className="text-lg font-medium mb-2">NextAuth 会话状态</h2>
            <div className="mb-2">
              <span className="font-medium">状态: </span>
              <span className={
                status === "authenticated" ? "text-green-600" :
                status === "loading" ? "text-blue-600" : "text-red-600"
              }>
                {status === "authenticated" ? "已认证" :
                 status === "loading" ? "加载中..." : "未认证"}
              </span>
            </div>
            {session && (
              <div className="bg-gray-50 p-2 rounded">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
            )}
          </div>
          
          {/* 服务器调试信息 */}
          {debugInfo && (
            <div className="rounded-md border p-4">
              <h2 className="text-lg font-medium mb-2">服务器调试信息</h2>
              
              <div className="mb-2">
                <span className="font-medium">环境: </span>
                <span>{debugInfo.environment?.nodeEnv || "未知"}</span>
              </div>
              
              <div className="mb-2">
                <span className="font-medium">数据库状态: </span>
                <span className={
                  debugInfo.database?.connectionStatus === "已连接" ? "text-green-600" : "text-red-600"
                }>
                  {debugInfo.database?.connectionStatus || "未知"}
                </span>
                {debugInfo.database?.error && (
                  <p className="text-red-500 text-sm mt-1">
                    错误: {debugInfo.database.error}
                  </p>
                )}
              </div>
              
              <div className="mb-2">
                <span className="font-medium">Cookie状态: </span>
                <div className="text-sm ml-2">
                  <div>NextAuth会话: {debugInfo.cookies?.hasSessionToken ? "存在" : "不存在"}</div>
                  <div>自定义令牌: {debugInfo.cookies?.hasCustomToken ? "存在" : "不存在"}</div>
                </div>
              </div>
              
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-blue-600">查看完整调试信息</summary>
                <div className="bg-gray-50 p-2 rounded mt-2">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}
          
          {/* 加载状态或错误 */}
          {loading && (
            <div className="text-center py-4">
              <p>加载中...</p>
            </div>
          )}
          
          {resetStatus && (
            <div className={`p-3 rounded-md ${
              resetStatus.includes("已重置") 
                ? "bg-green-50 text-green-700" 
                : resetStatus.includes("正在") 
                  ? "bg-blue-50 text-blue-700"
                  : "bg-red-50 text-red-700"
            }`}>
              {resetStatus}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <div className="flex gap-2 w-full">
            <Button 
              onClick={loadDebugInfo} 
              variant="outline" 
              className="flex-1"
              disabled={loading}
            >
              刷新信息
            </Button>
            <Button 
              onClick={resetAuth} 
              variant="destructive" 
              className="flex-1"
              disabled={loading}
            >
              重置认证状态
            </Button>
          </div>
          <Button 
            onClick={() => router.push("/login")} 
            className="w-full"
          >
            返回登录页
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 