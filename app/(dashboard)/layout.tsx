"use client";

import { useState, Suspense, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { cn } from "@/lib/utils";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";

// 加载指示器组件
function LoadingIndicator() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
    </div>
  );
}

// 内容组件 - 使用错误边界包裹内容
function DashboardContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hasError, setHasError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 添加全局错误处理
    const handleError = (error: ErrorEvent) => {
      console.error("全局错误捕获:", error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // 如果有错误，显示错误信息
  if (hasError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-100 p-6">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
          <h2 className="mb-4 text-2xl font-bold text-red-600">页面加载出错</h2>
          <p className="mb-6 text-gray-600">很抱歉，仪表盘加载过程中出现了问题。</p>
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              刷新页面
            </button>
            <button
              onClick={() => router.push('/login')}
              className="rounded border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              返回登录页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <Navbar onToggleSidebar={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden">
        <div
          className={cn(
            "bg-background transition-all duration-300 ease-in-out",
            sidebarOpen ? "w-64" : "w-0 -ml-64 md:ml-0 md:w-16"
          )}
        >
          <Sidebar className="h-full" />
        </div>
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 dark:bg-gray-900">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 不使用Suspense包裹整个布局，避免影响子组件的加载
  return (
    <SessionProvider>
      <DashboardContent>{children}</DashboardContent>
    </SessionProvider>
  );
} 