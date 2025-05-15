import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SubOrderForm } from "../../../components/sub-order-form";
import { getOrderById } from "../../../actions";
import { notFound } from "next/navigation";

interface NewSubOrderPageProps {
  params: {
    id: string;
  };
}

export const metadata = {
  title: "添加子订单 | 安钢集团永通球墨铸铁管订单管理系统",
};

export default async function NewSubOrderPage({ params }: NewSubOrderPageProps) {
  if (!params.id) {
    return notFound();
  }

  try {
    const { order } = await getOrderById(params.id);

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
            title="添加子订单"
            description={`为订单 ${order.orderNumber} 添加子订单`}
          />
          <Separator />
          <SubOrderForm orderId={params.id} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("获取订单详情失败:", error);
    return notFound();
  }
} 