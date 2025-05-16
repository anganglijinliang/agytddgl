import { Heading } from "@/components/ui/heading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";
import DashboardClient from "./dashboard-client";

// 使用静态页面包装动态的client组件
export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">正在加载仪表盘...</div>}>
      <DashboardClient />
    </Suspense>
  );
} 