"use client";

import { Suspense } from "react";
import LoginForm from "./form";

// 顶层组件包装Suspense以避免客户端组件中的useSearchParams的问题
export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="p-4 text-center">加载中...</div>}>
          <LoginForm />
        </Suspense>
      </div>
      <div className="mt-4 text-xs text-center text-slate-500">
        版本: 2.0.1 | 最后更新: 2025-05-14
      </div>
    </main>
  );
} 