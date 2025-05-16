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
      // 获取审计日志用于显示状态变更历史
      auditLogs: {
        where: {
          action: 'update_status',
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      },
    },
  });

  if (!order) {
    notFound();
  }

  // 计算生产和发运进度
  const calculateProgress = () => {
    let totalPlannedQuantity = 0;
    let totalProducedQuantity = 0;
    let totalShippedQuantity = 0;

    order.subOrders.forEach((subOrder) => {
      totalPlannedQuantity += subOrder.plannedQuantity;
      
      subOrder.production.forEach((prod) => {
        totalProducedQuantity += prod.quantity;
      });
      
      subOrder.shipping.forEach((ship) => {
        totalShippedQuantity += ship.quantity;
      });
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
      if (subOrder.production.length > 0 && (!latestProduction || new Date(subOrder.production[0].createdAt) > new Date(latestProduction.createdAt))) {
        latestProduction = subOrder.production[0];
      }
      if (subOrder.shipping.length > 0 && (!latestShipping || new Date(subOrder.shipping[0].createdAt) > new Date(latestShipping.createdAt))) {
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
              <p className="text-sm font-medium">最后更新</p>
              <p className="text-base">{formatDate(order.updatedAt)}</p>
            </div>
            <div>
              <p className="text-sm font-medium">发运方式</p>
              <p className="text-base">
                {order.shippingMethod === "SELF_DELIVERY" ? "厂家送货" : "客户自提"}
              </p>
            </div>
            {order.shippingAddress && (
              <div>
                <p className="text-sm font-medium">发运地址</p>
                <p className="text-base">{order.shippingAddress}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 进度统计卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              进度统计
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">生产进度</span>
                <span className="text-sm font-medium">{progress.production}%</span>
              </div>
              <Progress value={progress.production} className="h-2" />
              <div className="mt-1 text-xs text-muted-foreground">
                已生产 {progress.totalProducedQuantity} / 计划 {progress.totalPlannedQuantity} 支
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">发运进度</span>
                <span className="text-sm font-medium">{progress.shipping}%</span>
              </div>
              <Progress value={progress.shipping} className="h-2" />
              <div className="mt-1 text-xs text-muted-foreground">
                已发运 {progress.totalShippedQuantity} / 计划 {progress.totalPlannedQuantity} 支
              </div>
            </div>

            {latestProduction && (
              <div className="pt-2">
                <p className="text-xs text-muted-foreground">最近生产: {formatDate(latestProduction.createdAt)}</p>
              </div>
            )}

            {latestShipping && (
              <div>
                <p className="text-xs text-muted-foreground">最近发运: {formatDate(latestShipping.createdAt)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 订单进度跟踪 */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>订单进度跟踪</CardTitle>
            <CardDescription>
              跟踪您的订单处理状态
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${orderStage >= 1 ? 'bg-primary text-white' : 'bg-muted'}`}>
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">订单确认</p>
                  <p className="text-sm text-muted-foreground">
                    {orderStage >= 2 ? formatDate(order.updatedAt) : '等待中'}
                  </p>
                </div>
              </div>
              <div className="hidden sm:block w-full h-0.5 self-center bg-border"></div>
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${orderStage >= 3 ? 'bg-primary text-white' : 'bg-muted'}`}>
                  <Factory className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">生产中</p>
                  <p className="text-sm text-muted-foreground">
                    {orderStage >= 3 ? '进行中' : '未开始'}
                  </p>
                </div>
              </div>
              <div className="hidden sm:block w-full h-0.5 self-center bg-border"></div>
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${orderStage >= 4 ? 'bg-primary text-white' : 'bg-muted'}`}>
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">发运中</p>
                  <p className="text-sm text-muted-foreground">
                    {orderStage >= 4 ? '进行中' : '未开始'}
                  </p>
                </div>
              </div>
              <div className="hidden sm:block w-full h-0.5 self-center bg-border"></div>
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${orderStage >= 5 ? 'bg-primary text-white' : 'bg-muted'}`}>
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">已完成</p>
                  <p className="text-sm text-muted-foreground">
                    {orderStage >= 5 ? formatDate(order.updatedAt) : '等待中'}
                  </p>
                </div>
              </div>
            </div>

            {/* 状态变更历史 */}
            {order.auditLogs && order.auditLogs.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4" />
                  状态变更历史
                </h3>
                <div className="space-y-2">
                  {order.auditLogs.map((log) => (
                    <div key={log.id} className="text-sm border-l-2 border-primary pl-3 py-1">
                      <p className="font-medium">{log.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 订单详情 */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>订单详情</CardTitle>
            <CardDescription>
              球墨铸铁管订单规格信息
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.subOrders.map((subOrder, index) => (
                <div key={subOrder.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-lg">子订单 {index + 1}</h3>
                    <div className="flex gap-2 items-center">
                      <p className="text-sm">交货日期: {formatDate(subOrder.deliveryDate)}</p>
                      <Badge variant={subOrder.priorityLevel === "URGENT" || subOrder.priorityLevel === "CRITICAL" ? "destructive" : "outline"}>
                        {subOrder.priorityLevel === "LOW" && "低优先级"}
                        {subOrder.priorityLevel === "NORMAL" && "普通优先级"}
                        {subOrder.priorityLevel === "HIGH" && "高优先级"}
                        {subOrder.priorityLevel === "URGENT" && "紧急"}
                        {subOrder.priorityLevel === "CRITICAL" && "特急"}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-sm font-medium">规格</p>
                      <p className="text-sm text-muted-foreground">{subOrder.specification}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">级别</p>
                      <p className="text-sm text-muted-foreground">{subOrder.grade}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">接口形式</p>
                      <p className="text-sm text-muted-foreground">{subOrder.interfaceType}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">内衬</p>
                      <p className="text-sm text-muted-foreground">{subOrder.lining}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">长度</p>
                      <p className="text-sm text-muted-foreground">{subOrder.length}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">防腐措施</p>
                      <p className="text-sm text-muted-foreground">{subOrder.anticorrosion}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">计划支数</p>
                      <p className="text-sm text-muted-foreground">{subOrder.plannedQuantity} 支</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">单重</p>
                      <p className="text-sm text-muted-foreground">{subOrder.unitWeight} kg</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">总重</p>
                      <p className="text-sm text-muted-foreground">{subOrder.totalWeight} kg</p>
                    </div>
                  </div>

                  {/* 生产和发运记录 */}
                  {(subOrder.production.length > 0 || subOrder.shipping.length > 0) && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid gap-4 sm:grid-cols-2">
                        {subOrder.production.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">最近生产记录</h4>
                            <div className="text-xs space-y-1">
                              {subOrder.production.slice(0, 3).map((prod) => (
                                <div key={prod.id} className="flex justify-between">
                                  <span>{formatDate(prod.productionDate)}</span>
                                  <span>{prod.quantity} 支</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {subOrder.shipping.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">最近发运记录</h4>
                            <div className="text-xs space-y-1">
                              {subOrder.shipping.slice(0, 3).map((ship) => (
                                <div key={ship.id} className="flex justify-between">
                                  <span>{formatDate(ship.shippingDate)}</span>
                                  <span>{ship.quantity} 支</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <Button variant="outline" asChild>
              <Link href={`/`}>返回首页</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 