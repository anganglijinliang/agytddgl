"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { fetchNotifications, markAsRead } from "@/app/(dashboard)/dashboard/notifications/actions";
import { formatDateTime } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  linkUrl?: string;
}

export function NotificationBadge() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  
  // 获取通知
  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("获取通知失败:", error);
    }
  };

  // 标记通知为已读
  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error("标记通知失败:", error);
    }
  };

  // 处理通知点击
  const handleNotificationClick = async (notification: Notification) => {
    // 如果未读，标记为已读
    if (!notification.read) {
      await handleMarkAsRead(notification.id);
    }
    
    // 如果有链接，导航到链接
    if (notification.linkUrl) {
      setOpen(false);
      router.push(notification.linkUrl);
    }
  };

  // 获取通知类型对应的样式
  const getNotificationStyle = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "error":
        return "bg-red-100 text-red-800 border-red-300";
      case "success":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  // 组件加载时获取通知
  useEffect(() => {
    loadNotifications();
    
    // 每分钟刷新一次通知
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // 当弹出层打开时刷新通知
  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open]);

  // 未读通知数量
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-red-500 text-white"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-4 font-medium">
          通知
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {unreadCount} 未读
            </Badge>
          )}
        </div>
        <Separator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              暂无通知
            </div>
          ) : (
            notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`
                  p-4 border-b last:border-b-0 cursor-pointer
                  ${!notification.read ? 'bg-muted' : ''}
                `}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between">
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(notification.createdAt)}
                  </div>
                </div>
                <div className="mt-1 text-sm">{notification.message}</div>
                <div className={`mt-2 px-3 py-1 text-xs rounded-full border ${getNotificationStyle(notification.type)}`}>
                  {notification.type === "warning" && "警告"}
                  {notification.type === "error" && "错误"}
                  {notification.type === "success" && "成功"}
                  {notification.type === "info" && "信息"}
                </div>
              </div>
            ))
          )}
        </div>
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2 text-center">
              <Button 
                variant="link" 
                className="text-sm"
                onClick={() => router.push("/dashboard/notifications")}
              >
                查看全部通知
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
} 