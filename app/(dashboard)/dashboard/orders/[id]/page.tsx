import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Edit, Printer, Truck, Factory } from "lucide-react";
import Link from "next/link";
import { getOrderById } from "../actions";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubOrdersTable } from "../components/sub-orders-table";

interface OrderPageProps {
  params: {
    id: string;
  };
}

export default async function OrderPage({ params }: OrderPageProps) {
  // 检查ID是否存在
  if (!params.id) {
    return notFound();
  }

  // 获取订单详情
  try {
    const { order } = await getOrderById(params.id);

    const getStatusBadge = (status: string) => {
      const statusMap: Record<string, { text: string; variant: string }> = {
        DRAFT: { text: "草稿", variant: "outline" },
        CONFIRMED: { text: "已确认", variant: "secondary" },
        IN_PRODUCTION: { text: "生产中", variant: "default" },
        PARTIALLY_SHIPPED: { text: "部分发运", variant: "warning" },
        COMPLETED: { text: "已完成", variant: "success" },
        CANCELED: { text: "已取消", variant: "destructive" },
      };

      const statusInfo = statusMap[status] || { text: status, variant: "outline" };
      return <Badge variant={statusInfo.variant as any}>{statusInfo.text}</Badge>;
    };

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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Printer className="mr-2 h-4 w-4" />
              打印
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              导出
            </Button>
            <Button asChild>
              <Link href={`/dashboard/orders/${params.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                编辑订单
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold">
                订单 {order.orderNumber}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">订单状态:</dt>
                  <dd>{getStatusBadge(order.status)}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">创建日期:</dt>
                  <dd>{format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm')}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">最后更新:</dt>
                  <dd>{format(new Date(order.updatedAt), 'yyyy-MM-dd HH:mm')}</dd>
                </div>
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">发运方式:</dt>
                  <dd>
                    {order.shippingMethod === "SELF_DELIVERY" ? "厂家送货" : "客户自提"}
                  </dd>
                </div>
                {order.shippingAddress && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-500">送货地址:</dt>
                    <dd>{order.shippingAddress}</dd>
                  </div>
                )}
                {order.paymentTerms && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-500">付款条款:</dt>
                    <dd>{order.paymentTerms}</dd>
                  </div>
                )}
                {order.totalAmount && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-500">总金额:</dt>
                    <dd className="font-semibold">¥{order.totalAmount.toLocaleString()}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold">客户信息</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between text-sm">
                  <dt className="text-gray-500">客户名称:</dt>
                  <dd className="font-medium">{order.customer.name}</dd>
                </div>
                {order.customer.contactName && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-500">联系人:</dt>
                    <dd>{order.customer.contactName}</dd>
                  </div>
                )}
                {order.customer.phone && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-500">联系电话:</dt>
                    <dd>{order.customer.phone}</dd>
                  </div>
                )}
                {order.customer.email && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-500">电子邮箱:</dt>
                    <dd>{order.customer.email}</dd>
                  </div>
                )}
                {order.customer.address && (
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-500">地址:</dt>
                    <dd>{order.customer.address}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Heading title="子订单信息" description="此订单包含的子订单信息" />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/production/new?orderId=${params.id}`}>
                  <Factory className="mr-2 h-4 w-4" />
                  添加生产记录
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/shipping/new?orderId=${params.id}`}>
                  <Truck className="mr-2 h-4 w-4" />
                  添加发运记录
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/dashboard/orders/${params.id}/sub-order/new`}>
                  添加子订单
                </Link>
              </Button>
            </div>
          </div>
          <Separator />
          <SubOrdersTable subOrders={order.subOrders} />
        </div>

        {order.notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-bold">备注</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm">{order.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  } catch (error) {
    console.error("获取订单详情失败:", error);
    return notFound();
  }
} 