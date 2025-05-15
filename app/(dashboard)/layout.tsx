"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";
import { cn } from "@/lib/utils";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <SessionProvider>
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
    </SessionProvider>
  );
} 