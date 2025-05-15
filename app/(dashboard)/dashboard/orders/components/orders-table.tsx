"use client";

import { Order } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PencilIcon, EyeIcon, TrashIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

type OrderWithCustomer = Order & {
  customer: {
    name: string;
  };
};

interface OrdersTableProps {
  orders: OrderWithCustomer[];
  pageCount: number;
  currentPage: number;
}

export function OrdersTable({
  orders,
  pageCount,
  currentPage,
}: OrdersTableProps) {
  // 转换订单状态为中文
  const getStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; variant: string }> = {
      DRAFT: { text: "草稿", variant: "outline" },
      CONFIRMED: { text: "已确认", variant: "secondary" },
      IN_PRODUCTION: { text: "生产中", variant: "default" },
      PARTIALLY_SHIPPED: { text: "部分发运", variant: "warning" },
      COMPLETED: { text: "已完成", variant: "success" },
      CANCELED: { text: "已取消", variant: "destructive" },
    };

    return statusMap[status] || { text: status, variant: "outline" };
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>订单编号</TableHead>
            <TableHead>客户</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>创建日期</TableHead>
            <TableHead>总金额</TableHead>
            <TableHead>发运方式</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                暂无订单数据
              </TableCell>
            </TableRow>
          )}
          {orders.map((order) => {
            const status = getStatusText(order.status);
            return (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  {order.orderNumber}
                </TableCell>
                <TableCell>{order.customer.name}</TableCell>
                <TableCell>
                  <Badge variant={status.variant as any}>{status.text}</Badge>
                </TableCell>
                <TableCell>{formatDate(order.createdAt)}</TableCell>
                <TableCell>
                  {order.totalAmount
                    ? `¥${order.totalAmount.toLocaleString()}`
                    : "未定价"}
                </TableCell>
                <TableCell>
                  {order.shippingMethod === "SELF_DELIVERY"
                    ? "厂家送货"
                    : "客户自提"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <Link href={`/dashboard/orders/${order.id}`}>
                        <EyeIcon className="h-4 w-4" />
                        <span className="sr-only">查看</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <Link href={`/dashboard/orders/${order.id}/edit`}>
                        <PencilIcon className="h-4 w-4" />
                        <span className="sr-only">编辑</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive"
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span className="sr-only">删除</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
} 