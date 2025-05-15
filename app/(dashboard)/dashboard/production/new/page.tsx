"use client";

import { useSearchParams } from "next/navigation";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { ProductionForm } from "../components/production-form";
import { useEffect, useState, Suspense } from "react";

// 创建一个内部组件包含useSearchParams的逻辑
const ProductionPageContent = () => {
  const searchParams = useSearchParams();
  const subOrderId = searchParams.get("subOrderId");
  const [initialFormValues, setInitialFormValues] = useState<{ subOrderId?: string }>({});

  useEffect(() => {
    if (subOrderId) {
      setInitialFormValues({ subOrderId });
    }
  }, [subOrderId]);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div>
        <Heading 
          title="新增生产记录" 
          description={subOrderId ? "为指定子订单创建生产记录" : "创建新的生产进度记录"} 
        />
      </div>
      <Separator />
      <ProductionForm initialValues={initialFormValues} />
    </div>
  );
};

// 主页面组件使用Suspense包裹内容
const NewProductionPage = () => {
  return (
    <Suspense fallback={<div className="flex-1 space-y-4 p-8 pt-6">加载中...</div>}>
      <ProductionPageContent />
    </Suspense>
  );
};

export default NewProductionPage; 