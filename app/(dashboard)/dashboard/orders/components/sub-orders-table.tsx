"use client";

import { SubOrder, ProductionLine, Warehouse } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Factory, Truck } from "lucide-react";
import Link from "next/link";

interface SubOrderWithRelations extends SubOrder {
  productionLine?: ProductionLine | null;
  warehouse?: Warehouse | null;
}

interface SubOrdersTableProps {
  subOrders: SubOrderWithRelations[];
}

export function SubOrdersTable({ subOrders }: SubOrdersTableProps) {
  // 获取优先级徽章
  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { text: string; variant: string }> = {
      NORMAL: { text: "普通", variant: "secondary" },
      URGENT: { text: "紧急", variant: "warning" },
      CRITICAL: { text: "特急", variant: "destructive" },
    };

    const priorityInfo = priorityMap[priority] || { text: priority, variant: "secondary" };
    return <Badge variant={priorityInfo.variant as any}>{priorityInfo.text}</Badge>;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>规格</TableHead>
            <TableHead>级别</TableHead>
            <TableHead>接口形式</TableHead>
            <TableHead>内衬</TableHead>
            <TableHead>长度</TableHead>
            <TableHead>防腐</TableHead>
            <TableHead>计划数量</TableHead>
            <TableHead>单重(吨)</TableHead>
            <TableHead>总重量(吨)</TableHead>
            <TableHead>交货日期</TableHead>
            <TableHead>优先级</TableHead>
            <TableHead>生产线</TableHead>
            <TableHead>仓库</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subOrders.length === 0 && (
            <TableRow>
              <TableCell colSpan={14} className="h-24 text-center">
                暂无子订单数据
              </TableCell>
            </TableRow>
          )}
          {subOrders.map((subOrder) => (
            <TableRow key={subOrder.id}>
              <TableCell className="font-medium">{subOrder.specification}</TableCell>
              <TableCell>{subOrder.grade}</TableCell>
              <TableCell>{subOrder.interfaceType}</TableCell>
              <TableCell>{subOrder.lining}</TableCell>
              <TableCell>{subOrder.length}</TableCell>
              <TableCell>{subOrder.anticorrosion}</TableCell>
              <TableCell>{subOrder.plannedQuantity}</TableCell>
              <TableCell>{subOrder.unitWeight.toFixed(3)}</TableCell>
              <TableCell>{subOrder.totalWeight.toFixed(3)}</TableCell>
              <TableCell>{formatDate(subOrder.deliveryDate)}</TableCell>
              <TableCell>{getPriorityBadge(subOrder.priorityLevel)}</TableCell>
              <TableCell>
                {subOrder.productionLine?.name || "未分配"}
              </TableCell>
              <TableCell>
                {subOrder.warehouse?.name || "未分配"}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon" asChild title="添加生产记录">
                    <Link href={`/dashboard/production/new?subOrderId=${subOrder.id}`}>
                      <Factory className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="icon" asChild title="添加发货记录">
                    <Link href={`/dashboard/shipping/new?subOrderId=${subOrder.id}`}>
                      <Truck className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 