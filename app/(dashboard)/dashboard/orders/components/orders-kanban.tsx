"use client";

import { Order, OrderStatus } from "@prisma/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { OrderStatusBadge } from "./order-status-badge";

interface OrderWithCustomer extends Order {
  customer: {
    name: string;
  };
}

interface OrdersKanbanProps {
  orders: OrderWithCustomer[];
}

export function OrdersKanban({ orders }: OrdersKanbanProps) {
  // 按状态对订单进行分组
  const groupedOrders = orders.reduce<Record<OrderStatus, OrderWithCustomer[]>>(
    (acc, order) => {
      if (!acc[order.status]) {
        acc[order.status] = [];
      }
      acc[order.status].push(order);
      return acc;
    },
    {
      DRAFT: [],
      CONFIRMED: [],
      IN_PRODUCTION: [],
      PARTIALLY_SHIPPED: [],
      COMPLETED: [],
      CANCELED: []
    }
  );

  // 状态栏标题映射
  const statusLabels: Record<OrderStatus, string> = {
    DRAFT: "草稿",
    CONFIRMED: "已确认",
    IN_PRODUCTION: "生产中",
    PARTIALLY_SHIPPED: "部分发运",
    COMPLETED: "已完成",
    CANCELED: "已取消"
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {Object.entries(groupedOrders).map(([status, statusOrders]) => (
        <div key={status} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{statusLabels[status as OrderStatus]}</h3>
            <Badge variant="outline">{statusOrders.length}</Badge>
          </div>
          
          <div className="space-y-3">
            {statusOrders.map((order) => (
              <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="p-3 pb-0">
                    <CardTitle className="text-sm font-medium">{order.orderNumber}</CardTitle>
                    <CardDescription className="text-xs truncate">{order.customer.name}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-2 pb-0">
                    <OrderStatusBadge status={order.status} className="text-xs" />
                  </CardContent>
                  <CardFooter className="p-3 pt-2 text-xs text-muted-foreground">
                    创建于: {formatDate(order.createdAt)}
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 