"use client";

import { useSearchParams } from "next/navigation";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { ShippingForm } from "../components/shipping-form";
import { Suspense } from "react";

// 创建一个内部组件包含useSearchParams的逻辑
const ShippingPageContent = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div>
        <Heading title="新增发货记录" description="创建新的发货记录" />
      </div>
      <Separator />
      <ShippingForm />
    </div>
  );
};

// 主页面组件使用Suspense包裹内容
const NewShippingPage = () => {
  return (
    <Suspense fallback={<div className="flex-1 space-y-4 p-8 pt-6">加载中...</div>}>
      <ShippingPageContent />
    </Suspense>
  );
};

export default NewShippingPage; 