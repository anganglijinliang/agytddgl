import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { db } from "@/lib/db";
import { formatDate, cn } from "@/lib/utils";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { OrderStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Clock, 
  Truck, 
  Factory, 
  PackageCheck, 
  AlertCircle, 
  Info,
  Phone,
  MapPin,
  RefreshCw,
  CalendarClock,
  ArrowRightLeft
} from "lucide-react";
import Link from "next/link";

interface OrderTrackPageProps {
  params: {
    orderNumber: string;
  };
}

export default async function OrderTrackPage({ params }: OrderTrackPageProps) {
  // 获取订单信息
  const order = await db.order.findUnique({
    where: {
      orderNumber: params.orderNumber,
    },
    include: {
      customer: true,
      subOrders: {
        include: {
          production: {
            orderBy: {
              createdAt: 'desc',
            },
          },
          shipping: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // 单独查询与订单相关的审计日志
  const auditLogs = await db.auditLog.findMany({
    where: {
      resource: 'ORDER',
      resourceId: order.id,
      action: 'CHANGE_STATUS',
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
    include: {
      user: true,
    },
  });

  // 计算生产和发运进度
  const calculateProgress = () => {
    let totalPlannedQuantity = 0;
    let totalProducedQuantity = 0;
    let totalShippedQuantity = 0;

    order.subOrders.forEach((subOrder) => {
      totalPlannedQuantity += subOrder.plannedQuantity;
      
      if (subOrder.production) {
        subOrder.production.forEach((prod) => {
          totalProducedQuantity += prod.quantity;
        });
      }
      
      if (subOrder.shipping) {
        subOrder.shipping.forEach((ship) => {
          totalShippedQuantity += ship.quantity;
        });
      }
    });

    const productionProgress = totalPlannedQuantity > 0 
      ? Math.min(Math.round((totalProducedQuantity / totalPlannedQuantity) * 100), 100)
      : 0;
      
    const shippingProgress = totalPlannedQuantity > 0 
      ? Math.min(Math.round((totalShippedQuantity / totalPlannedQuantity) * 100), 100)
      : 0;

    return {
      production: productionProgress,
      shipping: shippingProgress,
      totalPlannedQuantity,
      totalProducedQuantity,
      totalShippedQuantity,
    };
  };

  const progress = calculateProgress();

  // 获取订单当前阶段
  const getOrderStage = (status: OrderStatus) => {
    switch (status) {
      case "DRAFT":
        return 1;
      case "CONFIRMED":
        return 2;
      case "IN_PRODUCTION":
        return 3;
      case "PARTIALLY_SHIPPED":
        return 4;
      case "COMPLETED":
        return 5;
      case "CANCELED":
        return -1;
      default:
        return 1;
    }
  };

  const orderStage = getOrderStage(order.status);

  // 获取最新的生产和发运记录
  const getLatestUpdate = () => {
    let latestProduction = null;
    let latestShipping = null;

    for (const subOrder of order.subOrders) {
      if (subOrder.production && subOrder.production.length > 0 && 
          (!latestProduction || new Date(subOrder.production[0].createdAt) > new Date(latestProduction.createdAt))) {
        latestProduction = subOrder.production[0];
      }
      if (subOrder.shipping && subOrder.shipping.length > 0 && 
          (!latestShipping || new Date(subOrder.shipping[0].createdAt) > new Date(latestShipping.createdAt))) {
        latestShipping = subOrder.shipping[0];
      }
    }

    return { latestProduction, latestShipping };
  };

  const { latestProduction, latestShipping } = getLatestUpdate();

  // 获取订单状态显示文本
  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case "DRAFT":
        return "草稿";
      case "CONFIRMED":
        return "已确认";
      case "IN_PRODUCTION":
        return "生产中";
      case "PARTIALLY_SHIPPED":
        return "部分发运";
      case "COMPLETED":
        return "已完成";
      case "CANCELED":
        return "已取消";
      default:
        return status;
    }
  };

  // 获取状态标签样式
  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case "DRAFT":
        return "outline";
      case "CONFIRMED":
        return "secondary";
      case "IN_PRODUCTION":
        return "default";
      case "PARTIALLY_SHIPPED":
        return "default";
      case "COMPLETED":
        return "success";
      case "CANCELED":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">球墨铸铁管订单跟踪</h1>
        <div className="flex items-center gap-2">
          <p className="text-lg text-muted-foreground">
            订单号: <span className="font-semibold">{order.orderNumber}</span>
          </p>
          <Badge variant={getStatusBadgeVariant(order.status)}>
            {getStatusText(order.status)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* 客户信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              客户信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">客户名称</p>
              <p className="text-base">{order.customer.name}</p>
            </div>
            {order.customer.contactName && (
              <div>
                <p className="text-sm font-medium">联系人</p>
                <p className="text-base">{order.customer.contactName}</p>
              </div>
            )}
            {order.customer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <p className="text-base">{order.customer.phone}</p>
              </div>
            )}
            {order.customer.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-base">{order.customer.address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 订单信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              订单信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">创建日期</p>
              <p className="text-base">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm font-medium">订单状态</p>
              <Badge variant={getStatusBadgeVariant(order.status)} className="mt-1">
                {getStatusText(order.status)}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium">运输方式</p>
              <p className="text-base">{order.shippingMethod}</p>
            </div>
            {order.shippingAddress && (
              <div>
                <p className="text-sm font-medium">发货地址</p>
                <p className="text-base">{order.shippingAddress}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 进度卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              订单进度
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <p className="text-sm font-medium">生产进度</p>
                <p className="text-sm font-medium">{progress.production}%</p>
              </div>
              <Progress value={progress.production} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                完成: {progress.totalProducedQuantity} / {progress.totalPlannedQuantity} 支
              </p>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <p className="text-sm font-medium">发运进度</p>
                <p className="text-sm font-medium">{progress.shipping}%</p>
              </div>
              <Progress value={progress.shipping} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                发运: {progress.totalShippedQuantity} / {progress.totalPlannedQuantity} 支
              </p>
            </div>

            <div className="pt-2">
              <Link href={`/dashboard/orders/${order.id}`} passHref>
                <Button variant="outline" size="sm" className="w-full">
                  查看详情
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 订单跟踪时间线 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            订单处理流程
          </CardTitle>
          <CardDescription>
            追踪您的订单从确认到完成的每个阶段
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* 时间线轴 */}
            <div className="absolute left-4 top-0 h-full w-px bg-border"></div>

            <div className="space-y-8 relative">
              {/* 订单确认 */}
              <div className="relative pl-10">
                <div className={cn(
                  "absolute left-0 top-1 h-8 w-8 rounded-full border flex items-center justify-center",
                  orderStage >= 2 ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border text-muted-foreground"
                )}>
                  {orderStage >= 2 ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                </div>
                <h3 className="text-lg font-semibold">订单确认</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {orderStage >= 2 ? "订单已确认，准备进入生产阶段" : "订单尚未确认"}
                </p>
                {orderStage >= 2 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    确认时间: {formatDate(order.updatedAt)}
                  </p>
                )}
              </div>

              {/* 生产阶段 */}
              <div className="relative pl-10">
                <div className={cn(
                  "absolute left-0 top-1 h-8 w-8 rounded-full border flex items-center justify-center",
                  orderStage >= 3 ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border text-muted-foreground"
                )}>
                  {orderStage >= 3 ? <CheckCircle2 className="h-5 w-5" /> : <Factory className="h-5 w-5" />}
                </div>
                <h3 className="text-lg font-semibold">生产阶段</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {orderStage >= 3 ? "订单已进入生产阶段" : "订单尚未进入生产阶段"}
                </p>
                {latestProduction && (
                  <p className="text-xs text-muted-foreground mt-2">
                    最近生产: {formatDate(latestProduction.createdAt)}，数量: {latestProduction.quantity} 支
                  </p>
                )}
                <div className="mt-3">
                  <div className="flex justify-between mb-1">
                    <p className="text-xs font-medium">生产进度</p>
                    <p className="text-xs font-medium">{progress.production}%</p>
                  </div>
                  <Progress value={progress.production} className="h-1.5" />
                </div>
              </div>

              {/* 发货阶段 */}
              <div className="relative pl-10">
                <div className={cn(
                  "absolute left-0 top-1 h-8 w-8 rounded-full border flex items-center justify-center",
                  orderStage >= 4 ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border text-muted-foreground"
                )}>
                  {orderStage >= 4 ? <CheckCircle2 className="h-5 w-5" /> : <Truck className="h-5 w-5" />}
                </div>
                <h3 className="text-lg font-semibold">发货阶段</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {orderStage >= 4 ? "订单已开始发货" : "订单尚未开始发货"}
                </p>
                {latestShipping && (
                  <p className="text-xs text-muted-foreground mt-2">
                    最近发货: {formatDate(latestShipping.createdAt)}，数量: {latestShipping.quantity} 支
                  </p>
                )}
                <div className="mt-3">
                  <div className="flex justify-between mb-1">
                    <p className="text-xs font-medium">发货进度</p>
                    <p className="text-xs font-medium">{progress.shipping}%</p>
                  </div>
                  <Progress value={progress.shipping} className="h-1.5" />
                </div>
              </div>

              {/* 完成 */}
              <div className="relative pl-10">
                <div className={cn(
                  "absolute left-0 top-1 h-8 w-8 rounded-full border flex items-center justify-center",
                  orderStage >= 5 ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border text-muted-foreground"
                )}>
                  {orderStage >= 5 ? <CheckCircle2 className="h-5 w-5" /> : <PackageCheck className="h-5 w-5" />}
                </div>
                <h3 className="text-lg font-semibold">订单完成</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {orderStage >= 5 ? "订单已全部完成发货" : "订单尚未完成"}
                </p>
                {orderStage >= 5 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    完成时间: {formatDate(order.updatedAt)}
                  </p>
                )}
              </div>

              {/* 状态变更历史 */}
              {auditLogs && auditLogs.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    状态变更历史
                  </h3>
                  <div className="space-y-2">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="text-sm border-l-2 border-primary pl-3 py-1">
                        <p className="font-medium">{log.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(log.createdAt)} {log.user?.name && `- ${log.user.name}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 规格明细 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>规格明细</CardTitle>
          <CardDescription>订单包含的管材规格明细</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">规格</th>
                  <th className="text-left py-3 px-4 font-medium">等级</th>
                  <th className="text-left py-3 px-4 font-medium">连接方式</th>
                  <th className="text-left py-3 px-4 font-medium">内衬</th>
                  <th className="text-left py-3 px-4 font-medium">长度</th>
                  <th className="text-right py-3 px-4 font-medium">数量</th>
                  <th className="text-right py-3 px-4 font-medium">已生产</th>
                  <th className="text-right py-3 px-4 font-medium">已发运</th>
                </tr>
              </thead>
              <tbody>
                {order.subOrders.map((subOrder) => {
                  const producedQuantity = subOrder.production
                    ? subOrder.production.reduce((sum, prod) => sum + prod.quantity, 0)
                    : 0;
                  const shippedQuantity = subOrder.shipping
                    ? subOrder.shipping.reduce((sum, ship) => sum + ship.quantity, 0)
                    : 0;
                  
                  return (
                    <tr key={subOrder.id} className="border-b">
                      <td className="py-3 px-4">{subOrder.specification}</td>
                      <td className="py-3 px-4">{subOrder.grade}</td>
                      <td className="py-3 px-4">{subOrder.interfaceType}</td>
                      <td className="py-3 px-4">{subOrder.lining}</td>
                      <td className="py-3 px-4">{subOrder.length}</td>
                      <td className="py-3 px-4 text-right">{subOrder.plannedQuantity}</td>
                      <td className="py-3 px-4 text-right">{producedQuantity}</td>
                      <td className="py-3 px-4 text-right">{shippedQuantity}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 