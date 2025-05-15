import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ClipboardList, Factory, Truck, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { OrderStatusChart } from "./components/order-status-chart";
import { ProductionShippingChart } from "./components/production-shipping-chart";

async function getStatistics() {
  // 获取订单总数
  const orderCount = await db.order.count();
  
  // 获取正在生产中的订单数
  const inProductionCount = await db.order.count({
    where: {
      status: "IN_PRODUCTION",
    },
  });
  
  // 获取已完成订单数
  const completedOrderCount = await db.order.count({
    where: {
      status: "COMPLETED",
    },
  });

  // 获取本月订单数
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const monthlyOrderCount = await db.order.count({
    where: {
      createdAt: {
        gte: startOfMonth,
      },
    },
  });

  // 获取生产记录总数
  const productionCount = await db.production.count();
  
  // 获取已生产数量总和
  const productionSumResult = await db.production.aggregate({
    _sum: {
      quantity: true,
    },
  });
  const productionSum = productionSumResult._sum.quantity || 0;

  // 获取发货记录总数
  const shippingCount = await db.shipping.count();
  
  // 获取已发货数量总和
  const shippingSumResult = await db.shipping.aggregate({
    _sum: {
      quantity: true,
    },
  });
  const shippingSum = shippingSumResult._sum.quantity || 0;

  // 获取总销售额
  const totalSalesResult = await db.order.aggregate({
    _sum: {
      totalAmount: true,
    },
    where: {
      status: {
        not: "CANCELED",
      },
    },
  });
  const totalSales = totalSalesResult._sum.totalAmount || 0;

  // 获取订单状态分布
  const orderStatusStats = await db.order.groupBy({
    by: ["status"],
    _count: {
      id: true,
    },
  });

  // 获取月度生产和发货数据（最近6个月）
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  // 按月查询生产记录
  const monthlyProduction = await db.$queryRaw<any[]>`
    SELECT 
      EXTRACT(MONTH FROM "createdAt") as month, 
      EXTRACT(YEAR FROM "createdAt") as year, 
      SUM(quantity) as total
    FROM "Production"
    WHERE "createdAt" >= ${sixMonthsAgo}
    GROUP BY EXTRACT(MONTH FROM "createdAt"), EXTRACT(YEAR FROM "createdAt")
    ORDER BY year, month
  `;

  // 按月查询发货记录
  const monthlyShipping = await db.$queryRaw<any[]>`
    SELECT 
      EXTRACT(MONTH FROM "createdAt") as month, 
      EXTRACT(YEAR FROM "createdAt") as year, 
      SUM(quantity) as total
    FROM "Shipping"
    WHERE "createdAt" >= ${sixMonthsAgo}
    GROUP BY EXTRACT(MONTH FROM "createdAt"), EXTRACT(YEAR FROM "createdAt")
    ORDER BY year, month
  `;

  return {
    orderCount,
    inProductionCount,
    completedOrderCount,
    monthlyOrderCount,
    productionCount,
    productionSum,
    shippingCount,
    shippingSum,
    totalSales,
    orderStatusStats,
    monthlyProduction,
    monthlyShipping,
  };
}

export default async function StatisticsPage() {
  await auth();
  const stats = await getStatistics();

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading title="数据统计" description="查看销售、生产和发货的统计数据" />
        </div>
        <Separator />

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总订单数</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.orderCount}</div>
              <p className="text-xs text-muted-foreground">
                本月新增: {stats.monthlyOrderCount}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总销售额</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{formatCurrency(stats.totalSales)}</div>
              <p className="text-xs text-muted-foreground">
                已完成订单: {stats.completedOrderCount}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">生产数量</CardTitle>
              <Factory className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.productionSum}</div>
              <p className="text-xs text-muted-foreground">
                生产记录: {stats.productionCount}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">发货数量</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.shippingSum}</div>
              <p className="text-xs text-muted-foreground">
                发货记录: {stats.shippingCount}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>订单状态分布</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <OrderStatusChart data={stats.orderStatusStats} />
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>生产与发货对比</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <ProductionShippingChart 
                  productionData={stats.monthlyProduction} 
                  shippingData={stats.monthlyShipping} 
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 