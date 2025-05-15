import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

// 获取未分配生产线的子订单
async function getUnassignedSubOrders() {
  try {
    return await db.subOrder.findMany({
      where: {
        productionLineId: null,
        order: {
          status: {
            in: ["CONFIRMED", "IN_PRODUCTION"]
          }
        }
      },
      include: {
        order: {
          include: {
            customer: true
          }
        }
      },
      orderBy: {
        deliveryDate: 'asc'
      },
      take: 10
    });
  } catch (error) {
    console.error("获取未分配子订单失败:", error);
    return [];
  }
}

// 获取各生产线上的子订单
async function getProductionLineSchedule() {
  try {
    // 获取所有生产线
    const productionLines = await db.productionLine.findMany();
    
    // 对每条生产线，获取分配给它的子订单
    const schedule = await Promise.all(
      productionLines.map(async (line) => {
        const subOrders = await db.subOrder.findMany({
          where: {
            productionLineId: line.id,
            order: {
              status: {
                in: ["CONFIRMED", "IN_PRODUCTION"]
              }
            }
          },
          include: {
            order: {
              include: {
                customer: true
              }
            },
            production: true
          },
          orderBy: {
            deliveryDate: 'asc'
          }
        });
        
        return {
          line,
          subOrders
        };
      })
    );
    
    return schedule;
  } catch (error) {
    console.error("获取生产线排期失败:", error);
    return [];
  }
}

export default async function ProductionPlanningPage() {
  await auth();
  
  const unassignedSubOrders = await getUnassignedSubOrders();
  const productionLineSchedule = await getProductionLineSchedule();

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading title="生产计划排期" description="管理生产线排期和任务分配" />
          <Button asChild>
            <Link href="/dashboard/master-data/production-lines">
              管理生产线
            </Link>
          </Button>
        </div>
        <Separator />

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>待分配的订单</CardTitle>
              <CardDescription>需要分配生产线的订单</CardDescription>
            </CardHeader>
            <CardContent>
              {unassignedSubOrders.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">暂无待分配订单</p>
              ) : (
                <div className="space-y-4">
                  {unassignedSubOrders.map((subOrder) => (
                    <div 
                      key={subOrder.id} 
                      className="border rounded-md p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div>
                        <p className="font-medium">{subOrder.order.orderNumber} - {subOrder.order.customer.name}</p>
                        <p className="text-sm text-muted-foreground">规格: {subOrder.specification}, 数量: {subOrder.plannedQuantity}</p>
                        <p className="text-sm text-muted-foreground">交货日期: {formatDate(subOrder.deliveryDate)}</p>
                      </div>
                      <Button asChild size="sm">
                        <Link href={`/dashboard/orders/${subOrder.orderId}/sub-order/${subOrder.id}`}>
                          分配生产线
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productionLineSchedule.map(({ line, subOrders }) => (
              <Card key={line.id}>
                <CardHeader>
                  <CardTitle>{line.name}</CardTitle>
                  <CardDescription>已分配 {subOrders.length} 个订单</CardDescription>
                </CardHeader>
                <CardContent>
                  {subOrders.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">暂无安排</p>
                  ) : (
                    <div className="space-y-4">
                      {subOrders.map((subOrder) => {
                        // 计算生产进度
                        const totalProduced = subOrder.production?.reduce((sum, p) => sum + p.quantity, 0) || 0;
                        const progress = Math.min(100, Math.round((totalProduced / subOrder.plannedQuantity) * 100));
                        
                        return (
                          <div 
                            key={subOrder.id} 
                            className="border rounded-md p-4"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{subOrder.order.orderNumber} - {subOrder.order.customer.name}</p>
                                <p className="text-sm text-muted-foreground">规格: {subOrder.specification}, 数量: {subOrder.plannedQuantity}</p>
                                <p className="text-sm text-muted-foreground">交货日期: {formatDate(subOrder.deliveryDate)}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{progress}%</p>
                                <p className="text-sm text-muted-foreground">已完成: {totalProduced}/{subOrder.plannedQuantity}</p>
                              </div>
                            </div>
                            {/* 进度条 */}
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 