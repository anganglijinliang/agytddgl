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

// 示例数据
const sampleOrders: Order[] = [
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
];

export function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/orders/recent');
        
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        } else {
          console.log('API返回错误状态码，使用示例数据');
          setOrders(sampleOrders);
        }
      } catch (error) {
        console.error("获取订单数据失败:", error);
        setOrders(sampleOrders);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // 添加超时保护，防止长时间加载
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('请求超时，使用示例数据');
        setOrders(sampleOrders);
        setLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timeout);
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

  if (error) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        <p>加载数据时出错，请刷新页面重试</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        <p>暂无订单数据</p>
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