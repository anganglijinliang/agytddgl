"use client";

import LoginForm from "./form";
import { LoginRecovery } from "./recovery";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-4">
      <div className="flex flex-col items-center justify-center space-y-2 text-center">
        <h1 className="text-3xl font-bold">登录</h1>
        <p className="text-gray-500">
          输入您的凭据以访问订单管理系统
        </p>
      </div>
      
      {/* 先显示恢复组件 */}
      <LoginRecovery />
      
      {/* 然后显示登录表单 */}
      <LoginForm />
    </div>
  );
} 