// Prisma类型问题解决工具

import { OrderStatus } from "@prisma/client";

// 将字符串转换为OrderStatus枚举值
export function toOrderStatus(statusString: string): OrderStatus {
  // 由于TypeScript限制，这里使用类型断言
  return statusString as OrderStatus;
}

// 创建包含resource字段的审计日志
export function createAuditLogEntry(data: {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  description: string;
  metadata?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  // 移除resource字段，使用正确的字段类型
  const { resource, ...restData } = data;
  
  return {
    ...restData
  };
} 