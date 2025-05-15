import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatDate, formatCurrency } from "@/lib/utils";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getStatusText } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, MapPin, Truck, Calendar, BarChart3 } from "lucide-react";

// 订单状态的徽章变体映射
const statusVariantMap = {
  DRAFT: "outline",
  CONFIRMED: "secondary",
  IN_PRODUCTION: "default",
  PARTIALLY_SHIPPED: "secondary",
  COMPLETED: "default",
  CANCELED: "destructive",
} as const;

export default async function OrderPublicPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  if (!id) {
    return notFound();
  }

  try {
    // 查询订单详情，包括子订单、客户和当前状态
    const order = await db.order.findUnique({
      where: { id },
      include: {
        customer: true,
        subOrders: {
          include: {
            production: {
              include: {
                productionLine: true,
              },
            },
            shipping: true,
          },
        },
      },
    });

    if (!order) {
      return notFound();
    }

    // 计算总生产进度
    const totalQuantity = order.subOrders.reduce(
      (sum, so) => sum + so.plannedQuantity,
      0
    );
    
    const producedQuantity = order.subOrders.reduce(
      (sum, so) => sum + so.production.reduce((p, prod) => p + prod.quantity, 0),
      0
    );
    
    const shippedQuantity = order.subOrders.reduce(
      (sum, so) => sum + so.shipping.reduce((p, ship) => p + ship.quantity, 0),
      0
    );
    
    const productionProgress = Math.min(100, Math.round((producedQuantity / totalQuantity) * 100) || 0);
    const shippingProgress = Math.min(100, Math.round((shippedQuantity / totalQuantity) * 100) || 0);

    return (
      <main className="min-h-screen bg-gray-50 pb-10">
        {/* 顶部导航栏 - 移动端友好 */}
        <div className="sticky top-0 z-10 bg-white shadow-sm border-b px-4 py-3 flex items-center">
          <Link 
            href="/" 
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span className="font-medium">返回</span>
          </Link>
          <div className="ml-auto">
            <Badge variant={statusVariantMap[order.status]}>
              {getStatusText(order.status)}
            </Badge>
          </div>
        </div>

        <div className="container max-w-4xl mx-auto py-6 px-4">
          {/* 头部 */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 mb-4">
              <Image
                src="/logo.png"
                alt="安钢集团永通"
                width={80}
                height={80}
                className="rounded-full"
                onError={(e) => {
                  // 如果logo加载失败，使用备用内容
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <h1 className="text-2xl font-bold text-center text-gray-900">
              安钢集团永通球墨铸铁管有限责任公司
            </h1>
            <p className="text-gray-500 mt-1">订单查询系统</p>
          </div>

          {/* 订单信息卡片 */}
          <Card className="mb-6 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <CardTitle>订单 #{order.orderNumber}</CardTitle>
                <div className="text-sm text-gray-500">
                  创建日期: {formatDate(order.createdAt)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500 flex items-center">
                    <Phone size={16} className="mr-2" /> 客户信息
                  </h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-lg font-medium">{order.customer.name}</p>
                    <p className="text-sm text-gray-500">{order.customer.contactName}</p>
                    <p className="text-sm text-gray-500">{order.customer.phone}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500 flex items-center">
                    <Truck size={16} className="mr-2" /> 发货信息
                  </h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm">
                      {order.shippingMethod === "SELF_DELIVERY" ? "厂家送货" : "客户自提"}
                    </p>
                    <p className="text-sm break-words">{order.shippingAddress}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-500 flex items-center">
                  <BarChart3 size={16} className="mr-2" /> 订单进度
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>生产进度</span>
                    <span className="font-medium">{productionProgress}%</span>
                  </div>
                  <Progress value={productionProgress} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>发运进度</span>
                    <span className="font-medium">{shippingProgress}%</span>
                  </div>
                  <Progress value={shippingProgress} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 子订单列表 */}
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Calendar size={20} className="mr-2" /> 订单明细
          </h2>
          <div className="space-y-4">
            {order.subOrders.map((subOrder) => (
              <Card key={subOrder.id} className="overflow-hidden shadow-sm">
                <CardHeader className="bg-gray-50 pb-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div>
                      <CardTitle className="text-base">
                        {subOrder.specification} / {subOrder.grade}
                      </CardTitle>
                      <CardDescription>
                        {subOrder.interfaceType} / {subOrder.lining} / {subOrder.length}
                      </CardDescription>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-sm font-medium flex items-center sm:justify-end">
                        <Calendar size={14} className="mr-1 flex-shrink-0" />
                        交货日期: {formatDate(subOrder.deliveryDate)}
                      </p>
                      <Badge variant="outline" className="mt-1">
                        {subOrder.priorityLevel === "HIGH" 
                          ? "高优先级" 
                          : subOrder.priorityLevel === "URGENT" 
                            ? "紧急" 
                            : subOrder.priorityLevel === "CRITICAL" 
                              ? "特急" 
                              : "普通"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-sm text-gray-500">计划数量</p>
                      <p className="font-medium">{subOrder.plannedQuantity} 支</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">单重</p>
                      <p className="font-medium">{subOrder.unitWeight} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">总重</p>
                      <p className="font-medium">{subOrder.totalWeight} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">防腐处理</p>
                      <p className="font-medium">{subOrder.anticorrosion}</p>
                    </div>
                  </div>
                  
                  {/* 生产信息 - 移动端优化 */}
                  {subOrder.production.length > 0 && (
                    <div className="mt-4">
                      <Separator className="my-3" />
                      <h4 className="font-medium mb-2">生产信息</h4>
                      <div className="space-y-2">
                        {subOrder.production.map((prod) => (
                          <div 
                            key={prod.id} 
                            className="text-sm bg-gray-50 p-2 rounded-md grid grid-cols-1 md:grid-cols-3 gap-2"
                          >
                            <div className="text-gray-500 flex items-center flex-wrap">
                              <Calendar size={14} className="mr-1 flex-shrink-0" />
                              {formatDate(prod.productionDate)}
                              <span className="mx-1">•</span>
                              {prod.productionLine.name}
                            </div>
                            <div>
                              状态: {getStatusText(prod.status)}
                            </div>
                            <div className="md:text-right">
                              数量: <span className="font-medium">{prod.quantity} 支</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 发货信息 - 移动端优化 */}
                  {subOrder.shipping.length > 0 && (
                    <div className="mt-4">
                      <Separator className="my-3" />
                      <h4 className="font-medium mb-2">发货信息</h4>
                      <div className="space-y-2">
                        {subOrder.shipping.map((ship) => (
                          <div 
                            key={ship.id} 
                            className="text-sm bg-gray-50 p-2 rounded-md grid grid-cols-1 md:grid-cols-3 gap-2"
                          >
                            <div className="text-gray-500 flex items-center">
                              <Calendar size={14} className="mr-1 flex-shrink-0" />
                              {formatDate(ship.shippingDate)}
                            </div>
                            <div>
                              运输方式: {ship.transportType === "TRUCK" ? "汽运" : 
                                        ship.transportType === "TRAIN" ? "火车" : 
                                        ship.transportType === "SHIP" ? "船运" : "其他"}
                            </div>
                            <div className="md:text-right">
                              数量: <span className="font-medium">{ship.quantity} 支</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* 页脚 */}
          <footer className="mt-12 text-center text-sm text-gray-500">
            <p className="mb-2">如需更多信息，请联系我们的客户服务部门</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-2 mb-4">
              <a href="tel:0372-123456" className="flex items-center hover:text-gray-900 transition-colors">
                <Phone size={14} className="mr-1" />
                0372-123456
              </a>
              <span className="hidden sm:inline">|</span>
              <a href="mailto:customer@angang-yongtong.com" className="flex items-center hover:text-gray-900 transition-colors">
                <Mail size={14} className="mr-1" />
                customer@angang-yongtong.com
              </a>
            </div>
            <div className="flex justify-center mt-4">
              <Link 
                href="/" 
                className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 transition-colors text-sm"
              >
                <ArrowLeft size={14} className="mr-1" />
                返回首页
              </Link>
            </div>
          </footer>
        </div>
      </main>
    );
  } catch (error) {
    console.error("获取订单详情失败:", error);
    return notFound();
  }
} 