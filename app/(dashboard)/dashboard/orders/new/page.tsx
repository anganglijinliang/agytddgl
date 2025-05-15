"use client";

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { OrderForm } from "../components/order-form";
import { getAllCustomers } from "../actions";
import { Suspense, useState, useEffect } from "react";

// 定义Customer类型
type Customer = {
  id: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

// 客户端组件，避免在构建时获取数据
const OrderPageContent = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { customers } = await getAllCustomers();
        setCustomers(customers);
      } catch (error) {
        console.error("获取客户列表失败:", error);
        setError("获取客户列表失败，请稍后重试");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  if (isLoading) {
    return <div className="flex-1 space-y-4 p-4 pt-6">加载中...</div>;
  }

  if (error) {
    return <div className="flex-1 space-y-4 p-4 pt-6">错误: {error}</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回订单列表
            </Link>
          </Button>
        </div>
      </div>
      <div className="space-y-4">
        <Heading
          title="新建订单"
          description="创建新的球墨铸铁管订单"
        />
        <Separator />
        <OrderForm 
          customers={customers}
          initialData={null}
        />
      </div>
    </div>
  );
};

// 主页面组件使用Suspense包裹内容
export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="flex-1 space-y-4 p-4 pt-6">加载中...</div>}>
      <OrderPageContent />
    </Suspense>
  );
} 