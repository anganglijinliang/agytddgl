"use client";

import { useSearchParams } from "next/navigation";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { ProductionForm } from "../components/production-form";
import { useEffect, useState, Suspense } from "react";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { withPermission } from "@/lib/rbac";

export const metadata = {
  title: "新增生产记录 | 安钢集团永通球墨铸铁管订单管理系统",
};

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
const NewProductionPage = async () => {
  // 权限检查
  await withPermission("production", "create");

  // 获取所有有效的生产线
  const productionLines = await db.productionLine.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  // 获取所有未完成的子订单
  const subOrders = await db.subOrder.findMany({
    where: {
      order: {
        status: {
          in: ["CONFIRMED", "IN_PRODUCTION", "PARTIALLY_SHIPPED"],
        }
      }
    },
    include: {
      order: {
        select: {
          orderNumber: true,
          customer: {
            select: {
              name: true
            }
          }
        }
      },
      production: {
        select: {
          quantity: true
        }
      }
    },
    orderBy: [
      { 
        priorityLevel: "desc" 
      },
      { 
        deliveryDate: "asc" 
      }
    ]
  });

  // 计算每个子订单已生产的数量
  const subOrdersWithProgress = subOrders.map(subOrder => {
    const producedQuantity = subOrder.production.reduce((sum, prod) => sum + prod.quantity, 0);
    const progress = subOrder.plannedQuantity > 0 
      ? Math.round((producedQuantity / subOrder.plannedQuantity) * 100) 
      : 0;
    
    return {
      ...subOrder,
      producedQuantity,
      progress,
      remainingQuantity: subOrder.plannedQuantity - producedQuantity,
      label: `${subOrder.order.orderNumber} - ${subOrder.specification} / ${subOrder.grade} (${progress}%)`
    }
  });

  // 过滤掉已完成的子订单
  const availableSubOrders = subOrdersWithProgress.filter(
    subOrder => subOrder.progress < 100
  );

  if (availableSubOrders.length === 0) {
    redirect("/dashboard/production?error=no-active-orders");
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <Heading title="新增生产记录" description="记录球墨铸铁管生产进度" />
      </div>
      <Separator />
      <ProductionForm 
        productionLines={productionLines}
        subOrders={availableSubOrders}
      />
    </div>
  );
};

export default NewProductionPage; 