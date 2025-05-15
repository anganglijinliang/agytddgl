import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { OrderForm } from "../../components/order-form";
import { getOrderById, getAllCustomers } from "../../actions";
import { notFound } from "next/navigation";

interface EditOrderPageProps {
  params: {
    id: string;
  };
}

export const metadata = {
  title: "编辑订单 | 安钢集团永通球墨铸铁管订单管理系统",
};

export default async function EditOrderPage({ params }: EditOrderPageProps) {
  if (!params.id) {
    return notFound();
  }

  try {
    const [{ order }, { customers }] = await Promise.all([
      getOrderById(params.id),
      getAllCustomers(),
    ]);

    return (
      <div className="flex-1 space-y-4 p-4 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/dashboard/orders/${params.id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回订单详情
              </Link>
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          <Heading
            title="编辑订单"
            description={`编辑订单 ${order.orderNumber}`}
          />
          <Separator />
          <OrderForm customers={customers} initialData={order} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("获取订单详情失败:", error);
    return notFound();
  }
} 