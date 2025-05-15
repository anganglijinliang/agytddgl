import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

// 获取仓库库存数据
async function getInventoryData() {
  try {
    // 获取所有仓库
    const warehouses = await db.warehouse.findMany();
    
    // 对每个仓库，获取其中的子订单及其生产和发货情况
    const inventoryData = await Promise.all(
      warehouses.map(async (warehouse) => {
        const subOrders = await db.subOrder.findMany({
          where: {
            warehouseId: warehouse.id,
          },
          include: {
            order: {
              include: {
                customer: true,
              },
            },
            production: true,
            shipping: true,
          },
        });
        
        // 计算每个子订单的库存情况
        const subOrdersWithInventory = subOrders.map((subOrder) => {
          const totalProduced = (subOrder.production || []).reduce(
            (sum, p) => sum + p.quantity, 
            0
          );
          const totalShipped = (subOrder.shipping || []).reduce(
            (sum, s) => sum + s.quantity, 
            0
          );
          const inStock = totalProduced - totalShipped;
          
          return {
            ...subOrder,
            totalProduced,
            totalShipped,
            inStock,
          };
        });
        
        return {
          warehouse,
          subOrders: subOrdersWithInventory,
          totalInStock: subOrdersWithInventory.reduce((sum, so) => sum + so.inStock, 0),
        };
      })
    );
    
    return inventoryData;
  } catch (error) {
    console.error("获取库存数据失败:", error);
    return [];
  }
}

// 获取即将出库的记录
async function getUpcomingShipments() {
  const twoWeeksLater = new Date();
  twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
  
  try {
    // 查找未来两周内计划交货的订单
    const upcomingOrders = await db.subOrder.findMany({
      where: {
        deliveryDate: {
          lte: twoWeeksLater,
        },
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
        shipping: true,
        warehouse: true,
      },
      orderBy: {
        deliveryDate: "asc",
      },
      take: 10,
    });
    
    // 计算每个订单的库存和发货情况
    return upcomingOrders.map((order) => {
      const totalProduced = (order.production || []).reduce(
        (sum, p) => sum + p.quantity, 
        0
      );
      const totalShipped = (order.shipping || []).reduce(
        (sum, s) => sum + s.quantity, 
        0
      );
      const remaining = order.plannedQuantity - totalShipped;
      const inStock = totalProduced - totalShipped;
      const shortage = remaining - inStock > 0 ? remaining - inStock : 0;
      
      return {
        ...order,
        totalProduced,
        totalShipped,
        remaining,
        inStock,
        shortage,
      };
    });
  } catch (error) {
    console.error("获取即将出库记录失败:", error);
    return [];
  }
}

export default async function InventoryPage() {
  await auth();
  
  const inventoryData = await getInventoryData();
  const upcomingShipments = await getUpcomingShipments();
  
  // 找出库存不足的情况
  const shortages = upcomingShipments.filter(order => order.shortage > 0);

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading title="库存管理" description="查看和管理各仓库的库存情况" />
          <Button asChild>
            <Link href="/dashboard/master-data/warehouses">
              管理仓库
            </Link>
          </Button>
        </div>
        <Separator />

        {shortages.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>库存告警</AlertTitle>
            <AlertDescription>
              有 {shortages.length} 个即将交货的订单库存不足，请及时安排生产。
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>仓库库存概览</CardTitle>
              <CardDescription>各仓库当前库存情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {inventoryData.map(({ warehouse, totalInStock }) => (
                  <Card key={warehouse.id}>
                    <CardHeader className="py-4">
                      <CardTitle className="text-xl">{warehouse.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{totalInStock}</div>
                      <p className="text-muted-foreground">库存总量</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>即将出库</CardTitle>
              <CardDescription>未来两周内计划交货的订单</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>订单号</TableHead>
                    <TableHead>客户</TableHead>
                    <TableHead>规格</TableHead>
                    <TableHead>交货日期</TableHead>
                    <TableHead>需发货</TableHead>
                    <TableHead>库存</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingShipments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        暂无即将出库的订单
                      </TableCell>
                    </TableRow>
                  ) : (
                    upcomingShipments.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.order.orderNumber}</TableCell>
                        <TableCell>{order.order.customer.name}</TableCell>
                        <TableCell>{order.specification}</TableCell>
                        <TableCell>{formatDate(order.deliveryDate)}</TableCell>
                        <TableCell>{order.remaining}</TableCell>
                        <TableCell>{order.inStock}</TableCell>
                        <TableCell>
                          {order.shortage > 0 ? (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                              缺货 {order.shortage}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              充足
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {inventoryData.map(({ warehouse, subOrders }) => (
              <Card key={warehouse.id}>
                <CardHeader>
                  <CardTitle>{warehouse.name} 详细库存</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>订单号</TableHead>
                        <TableHead>客户</TableHead>
                        <TableHead>规格</TableHead>
                        <TableHead>已生产</TableHead>
                        <TableHead>已发货</TableHead>
                        <TableHead>库存</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">
                            该仓库暂无库存
                          </TableCell>
                        </TableRow>
                      ) : (
                        subOrders.map((subOrder) => (
                          <TableRow key={subOrder.id}>
                            <TableCell>{subOrder.order.orderNumber}</TableCell>
                            <TableCell>{subOrder.order.customer.name}</TableCell>
                            <TableCell>{subOrder.specification}</TableCell>
                            <TableCell>{subOrder.totalProduced}</TableCell>
                            <TableCell>{subOrder.totalShipped}</TableCell>
                            <TableCell>
                              {subOrder.inStock > 0 ? (
                                <span className="font-medium">{subOrder.inStock}</span>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 