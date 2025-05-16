import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { withPermission } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { Share2, Download, Printer } from "lucide-react";
import QRCode from "react-qr-code";

interface QRCodePageProps {
  params: {
    id: string;
  };
}

export default async function OrderQRCodePage({ params }: QRCodePageProps) {
  // 权限检查
  await withPermission("orders", "view");

  const order = await db.order.findUnique({
    where: {
      id: params.id,
    },
    include: {
      customer: true,
      subOrders: true,
    },
  });

  if (!order) {
    redirect("/dashboard/orders");
  }

  // 构建查询URL
  const baseUrl = process.env.NEXTAUTH_URL || 'https://angang-order.vercel.app';
  const queryUrl = `${baseUrl}/order/track/${order.orderNumber}`;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">订单二维码</h2>
          <p className="text-muted-foreground">
            订单号: {order.orderNumber}
          </p>
        </div>
        <Button variant="outline" onClick={() => window.history.back()}>
          返回
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>订单二维码</CardTitle>
            <CardDescription>
              扫描此二维码可查询订单生产进度和发运情况
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <div className="p-4 bg-white rounded">
              <QRCode value={queryUrl} size={200} />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              打印二维码
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              下载二维码
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>订单信息</CardTitle>
            <CardDescription>
              订单基本信息及跟踪链接
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">客户名称</p>
              <p className="text-sm text-muted-foreground">{order.customer.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">订单状态</p>
              <p className="text-sm text-muted-foreground">
                {order.status === "DRAFT" && "草稿"}
                {order.status === "CONFIRMED" && "已确认"}
                {order.status === "IN_PRODUCTION" && "生产中"}
                {order.status === "PARTIALLY_SHIPPED" && "部分发运"}
                {order.status === "COMPLETED" && "已完成"}
                {order.status === "CANCELED" && "已取消"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">发运方式</p>
              <p className="text-sm text-muted-foreground">
                {order.shippingMethod === "SELF_DELIVERY" ? "自发" : "自提"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">跟踪链接</p>
              <p className="text-sm text-muted-foreground break-all">
                {queryUrl}
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">
              <Share2 className="mr-2 h-4 w-4" />
              分享跟踪链接
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 