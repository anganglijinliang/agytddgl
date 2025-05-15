import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, formatStr?: string) {
  const d = new Date(date);
  
  if (formatStr) {
    return format(d, formatStr, { locale: zhCN });
  }
  
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number) {
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function generateOrderNumber() {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");

  return `ORD${year}${month}${day}${random}`;
}

export function calculateTotalWeight(unitWeight: number, quantity: number) {
  return parseFloat((unitWeight * quantity).toFixed(2));
}

export function getProgressPercentage(current: number, total: number) {
  if (total === 0) return 0;
  return Math.min(100, Math.round((current / total) * 100));
}

export function isValidEmail(email: string) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function truncateText(text: string, maxLength: number) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function getInitials(name: string): string {
  if (!name) return "U";
  
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export function getStatusColor(status: string) {
  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-200 text-gray-800",
    CONFIRMED: "bg-blue-200 text-blue-800",
    IN_PRODUCTION: "bg-yellow-200 text-yellow-800",
    PARTIALLY_SHIPPED: "bg-orange-200 text-orange-800",
    COMPLETED: "bg-green-200 text-green-800",
    CANCELED: "bg-red-200 text-red-800",
    NOT_STARTED: "bg-gray-200 text-gray-800",
    IN_PROGRESS: "bg-yellow-200 text-yellow-800",
    PAUSED: "bg-orange-200 text-orange-800",
    NORMAL: "bg-blue-200 text-blue-800",
    URGENT: "bg-orange-200 text-orange-800",
    CRITICAL: "bg-red-200 text-red-800",
  };

  return statusColors[status] || "bg-gray-200 text-gray-800";
}

export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    DRAFT: "草稿",
    CONFIRMED: "已确认",
    IN_PRODUCTION: "生产中",
    PARTIALLY_SHIPPED: "部分发货",
    COMPLETED: "已完成",
    CANCELED: "已取消",
    NOT_STARTED: "未开始",
    IN_PROGRESS: "进行中",
    FINISHED: "已完成",
  };

  return statusMap[status] || status;
} 