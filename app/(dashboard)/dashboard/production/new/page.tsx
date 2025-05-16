import { ProductionForm } from "../components/production-form";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { withPermission } from "@/lib/rbac";

export const metadata = {
  title: "新增生产记录 | 安钢集团永通球墨铸铁管订单管理系统",
};

export default async function NewProductionPage() {
  // 权限检查
  await withPermission("production", "create");

  // 获取所有子订单信息
  const subOrders = await db.subOrder.findMany({
    where: {
      order: {
        status: {
          in: ["CONFIRMED", "IN_PRODUCTION", "PARTIALLY_SHIPPED"],
        },
      },
    },
    include: {
      order: {
        include: {
          customer: true,
        },
      },
      production: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // 计算每个子订单的生产进度
  const enhancedSubOrders = subOrders.map((subOrder) => {
    const producedQuantity = subOrder.production.reduce(
      (sum, prod) => sum + prod.quantity,
      0
    );
    const progress = Math.round(
      (producedQuantity / subOrder.plannedQuantity) * 100
    );
    const remainingQuantity = Math.max(
      0,
      subOrder.plannedQuantity - producedQuantity
    );

    return {
      ...subOrder,
      producedQuantity,
      progress,
      remainingQuantity,
      label: `${subOrder.order.orderNumber} - ${subOrder.order.customer.name} - ${subOrder.specification} - ${subOrder.grade} (${remainingQuantity}/${subOrder.plannedQuantity})`,
    };
  });

  // 获取所有生产线
  const productionLines = await db.productionLine.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">创建生产记录</h2>
        <Button variant="outline" asChild>
          <Link href="/dashboard/production">返回</Link>
        </Button>
      </div>

      <ProductionForm
        productionLines={productionLines}
        subOrders={enhancedSubOrders}
      />
    </div>
  );
} 