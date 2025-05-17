"use client";

import { Suspense } from "react";
import LoginForm from "./form";
import { LoginRecovery } from "./recovery";

// 创建一个简单的加载组件
function Loading() {
  return <div className="text-center p-4">加载中...</div>;
}

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-4">
      <div className="flex flex-col items-center justify-center space-y-2 text-center">
        <h1 className="text-3xl font-bold">登录</h1>
        <p className="text-gray-500">
          输入您的凭据以访问订单管理系统
        </p>
      </div>
      
      {/* 用Suspense包裹恢复组件 */}
      <Suspense fallback={<Loading />}>
        <LoginRecovery />
      </Suspense>
      
      {/* 使用Suspense包裹LoginForm */}
      <Suspense fallback={<Loading />}>
        <LoginForm />
      </Suspense>
    </div>
  );
} 