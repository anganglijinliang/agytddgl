"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// 获取当前用户的通知
export async function fetchNotifications() {
  const session = await auth();
  if (!session?.user) {
    return [];
  }

  try {
    const notifications = await db.notification.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    // 将日期转换为字符串，null转换为undefined
    return notifications.map(notification => ({
      ...notification,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
      linkUrl: notification.linkUrl || undefined
    }));
  } catch (error) {
    console.error("获取通知失败:", error);
    throw new Error("获取通知失败");
  }
}

// 获取所有通知（分页）
export async function fetchAllNotifications(page = 1, pageSize = 20) {
  const session = await auth();
  if (!session?.user) {
    return { notifications: [], totalPages: 0 };
  }

  try {
    const skip = (page - 1) * pageSize;

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: pageSize,
      }),
      db.notification.count({
        where: {
          userId: session.user.id,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    // 将日期转换为字符串，null转换为undefined
    const formattedNotifications = notifications.map(notification => ({
      ...notification,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
      linkUrl: notification.linkUrl || undefined
    }));

    return { notifications: formattedNotifications, totalPages };
  } catch (error) {
    console.error("获取所有通知失败:", error);
    throw new Error("获取所有通知失败");
  }
}

// 标记通知为已读
export async function markAsRead(notificationId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("未授权");
  }

  try {
    await db.notification.update({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
      data: {
        read: true,
      },
    });

    revalidatePath("/dashboard/notifications");
    return { success: true };
  } catch (error) {
    console.error("标记通知失败:", error);
    throw new Error("标记通知失败");
  }
}

// 标记所有通知为已读
export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("未授权");
  }

  try {
    await db.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    revalidatePath("/dashboard/notifications");
    return { success: true };
  } catch (error) {
    console.error("标记所有通知失败:", error);
    throw new Error("标记所有通知失败");
  }
}

// 删除通知
export async function deleteNotification(notificationId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("未授权");
  }

  try {
    await db.notification.delete({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
    });

    revalidatePath("/dashboard/notifications");
    return { success: true };
  } catch (error) {
    console.error("删除通知失败:", error);
    throw new Error("删除通知失败");
  }
}

// 创建自动通知的函数 - 用于系统内部调用
export async function createNotification({
  userId,
  title,
  message,
  type,
  linkUrl,
}: {
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  linkUrl?: string;
}) {
  try {
    await db.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        linkUrl,
        read: false,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("创建通知失败:", error);
    throw new Error("创建通知失败");
  }
}

// 创建库存告警通知
export async function createInventoryAlert(
  userId: string,
  subOrderId: string,
  orderNumber: string,
  specification: string,
  shortage: number
) {
  const title = "库存告警";
  const message = `订单 ${orderNumber} 规格 ${specification} 库存不足，缺少 ${shortage} 件产品`;
  const linkUrl = `/dashboard/inventory`;

  return createNotification({
    userId,
    title,
    message,
    type: "warning",
    linkUrl,
  });
}

// 创建交货日期告警通知
export async function createDeliveryDateAlert(
  userId: string,
  subOrderId: string,
  orderNumber: string,
  specification: string,
  daysRemaining: number
) {
  const title = "交货日期临近";
  const message = `订单 ${orderNumber} 规格 ${specification} 将在 ${daysRemaining} 天内到期交货`;
  const linkUrl = `/dashboard/orders/${subOrderId}`;

  return createNotification({
    userId,
    title,
    message,
    type: "warning",
    linkUrl,
  });
} 