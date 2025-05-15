"use client";

import { OrderStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const statusConfig: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: {
    label: "草稿",
    variant: "outline"
  },
  CONFIRMED: {
    label: "已确认",
    variant: "secondary"
  },
  IN_PRODUCTION: {
    label: "生产中",
    variant: "default"
  },
  PARTIALLY_SHIPPED: {
    label: "部分发运",
    variant: "secondary"
  },
  COMPLETED: {
    label: "已完成",
    variant: "default"
  },
  CANCELED: {
    label: "已取消",
    variant: "destructive"
  }
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant={config.variant}
      className={cn(className)}
    >
      {config.label}
    </Badge>
  );
} 