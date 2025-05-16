"use client";

import { Suspense } from "react";
import LoginForm from "./form";

// 顶层组件包装Suspense以避免客户端组件中的useSearchParams的问题
export default function LoginPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const error = searchParams?.error ? String(searchParams.error) : undefined;
  
  // 安全处理searchParams，避免打印未定义的对象
  const safeSearchParams = searchParams ?? {};
  const hasSearchParams = !!searchParams && Object.keys(safeSearchParams).length > 0;
  
  // 调试信息 - 记录页面加载和错误状态
  console.log("登录页面加载", { 
    error,
    hasSearchParams,
    // 只打印有限的信息，避免循环引用
    searchParams: hasSearchParams ? 
      Object.fromEntries(
        Object.entries(safeSearchParams).map(([k, v]) => [k, String(v)])
      ) : {}
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="p-4 text-center">加载中...</div>}>
          <LoginForm error={error} />
        </Suspense>
        
        {/* 如果有错误参数，显示相关诊断信息 */}
        {error === "Configuration" && (
          <div className="mt-4 rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">服务器配置问题</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>系统检测到服务器配置错误。此错误通常与NextAuth配置相关，例如：</p>
                  <ul className="list-disc pl-5 mt-1">
                    <li>环境变量缺失或不正确（NEXTAUTH_SECRET, DATABASE_URL等）</li>
                    <li>会话管理配置有误</li>
                    <li>认证提供商配置错误</li>
                  </ul>
                  <p className="mt-2">
                    请尝试重新登录，如果问题持续存在，请联系管理员查看服务器日志。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 text-xs text-center text-slate-500">
        版本: 2.0.2 | 最后更新: 2025-05-16
      </div>
    </main>
  );
} 