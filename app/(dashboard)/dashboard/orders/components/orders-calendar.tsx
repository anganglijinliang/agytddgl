"use client";

import { Order } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import { OrderStatusBadge } from "./order-status-badge";
import { cn, formatDate } from "@/lib/utils";
import Link from "next/link";

interface OrderWithCustomer extends Order {
  customer: {
    name: string;
  };
}

interface OrdersCalendarProps {
  orders: OrderWithCustomer[];
}

export function OrdersCalendar({ orders }: OrdersCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // 对订单按日期进行分组
  const ordersByDate = orders.reduce<Record<string, OrderWithCustomer[]>>(
    (acc, order) => {
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(order);
      return acc;
    },
    {}
  );
  
  // 日历上的日期装饰
  const orderDates = Object.keys(ordersByDate);
  
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <Card className="lg:w-1/3">
        <CardContent className="p-4">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
            modifiers={{
              hasOrders: (day) => {
                return orderDates.includes(day.toISOString().split('T')[0]);
              }
            }}
            modifiersClassNames={{
              hasOrders: "bg-primary/10 text-primary font-medium"
            }}
          />
        </CardContent>
      </Card>
      
      <div className="lg:w-2/3 space-y-4">
        <h3 className="font-medium text-lg">
          {date ? formatDate(date, 'yyyy年MM月dd日') : "所有订单"}的订单
        </h3>
        
        {date && (
          <div className="space-y-3">
            {ordersByDate[date.toISOString().split('T')[0]]?.map((order) => (
              <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{order.orderNumber}</div>
                      <div className="text-sm text-muted-foreground">{order.customer.name}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <OrderStatusBadge status={order.status} />
                      <div className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt, 'HH:mm:ss')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )) || (
              <div className="text-center py-8 text-muted-foreground">
                该日期没有订单
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 