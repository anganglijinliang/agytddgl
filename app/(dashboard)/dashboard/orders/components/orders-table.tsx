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
import { QrCode } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

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
    <div className="space-y-4">
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
                    <Link href={`/dashboard/orders/${order.id}`} className="hover:underline">
                      {order.orderNumber}
                    </Link>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">打开菜单</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>操作</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/orders/${order.id}`}>
                            <EyeIcon className="mr-2 h-4 w-4" />
                            查看详情
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/orders/${order.id}/qrcode`}>
                            <QrCode className="mr-2 h-4 w-4" />
                            查看二维码
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <TrashIcon className="mr-2 h-4 w-4" />
                          删除订单
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 