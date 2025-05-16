"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  date: string;
  status: "pending" | "processing" | "completed" | "shipped";
  amount: number;
}

export function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/orders/recent');
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        } else {
          // 如果API不可用，使用示例数据
          setOrders([
            {
              id: "1",
              orderNumber: "ORD-2023-1001",
              customerName: "河南建设集团",
              date: new Date().toISOString(),
              status: "processing",
              amount: 250000,
            },
            {
              id: "2",
              orderNumber: "ORD-2023-1002",
              customerName: "郑州市政工程",
              date: new Date(Date.now() - 86400000).toISOString(),
              status: "shipped",
              amount: 135000,
            },
            {
              id: "3",
              orderNumber: "ORD-2023-1003",
              customerName: "安阳建筑公司",
              date: new Date(Date.now() - 172800000).toISOString(),
              status: "completed",
              amount: 420000,
            },
            {
              id: "4",
              orderNumber: "ORD-2023-1004",
              customerName: "洛阳水利局",
              date: new Date(Date.now() - 259200000).toISOString(),
              status: "pending",
              amount: 185000,
            },
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch recent orders:", error);
        // 使用示例数据
        setOrders([
          {
            id: "1",
            orderNumber: "ORD-2023-1001",
            customerName: "河南建设集团",
            date: new Date().toISOString(),
            status: "processing",
            amount: 250000,
          },
          {
            id: "2",
            orderNumber: "ORD-2023-1002",
            customerName: "郑州市政工程",
            date: new Date(Date.now() - 86400000).toISOString(),
            status: "shipped",
            amount: 135000,
          },
          {
            id: "3",
            orderNumber: "ORD-2023-1003",
            customerName: "安阳建筑公司",
            date: new Date(Date.now() - 172800000).toISOString(),
            status: "completed",
            amount: 420000,
          },
          {
            id: "4",
            orderNumber: "ORD-2023-1004",
            customerName: "洛阳水利局",
            date: new Date(Date.now() - 259200000).toISOString(),
            status: "pending",
            amount: 185000,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>订单号</TableHead>
          <TableHead>客户</TableHead>
          <TableHead>日期</TableHead>
          <TableHead>状态</TableHead>
          <TableHead className="text-right">金额</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">{order.orderNumber}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {order.customerName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <span>{order.customerName}</span>
              </div>
            </TableCell>
            <TableCell>{formatDate(order.date)}</TableCell>
            <TableCell>
              <Badge
                variant={
                  order.status === "completed"
                    ? "default"
                    : order.status === "processing"
                    ? "secondary"
                    : order.status === "shipped"
                    ? "success"
                    : "outline"
                }
              >
                {order.status === "completed"
                  ? "已完成"
                  : order.status === "processing"
                  ? "生产中"
                  : order.status === "shipped"
                  ? "已发运"
                  : "待处理"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {`¥${order.amount.toLocaleString('zh-CN')}`}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 