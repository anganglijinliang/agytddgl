// 用户角色枚举
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  ORDER_SPECIALIST = "ORDER_SPECIALIST",
  PRODUCTION_STAFF = "PRODUCTION_STAFF",
  SHIPPING_STAFF = "SHIPPING_STAFF",
  READ_ONLY = "READ_ONLY",
}

// 订单状态枚举
export enum OrderStatus {
  DRAFT = "DRAFT",
  CONFIRMED = "CONFIRMED",
  IN_PRODUCTION = "IN_PRODUCTION",
  PARTIALLY_SHIPPED = "PARTIALLY_SHIPPED",
  COMPLETED = "COMPLETED",
  CANCELED = "CANCELED",
}

// 会话用户类型扩展
export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
}

// 通知类型
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  linkUrl?: string;
} 