"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Trash2,
  Eye
} from "lucide-react";
import { deleteNotification, markAllAsRead, markAsRead } from "../actions";
import { useRouter } from "next/navigation";
import { Pagination } from "@/components/ui/pagination";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  linkUrl?: string;
}

interface NotificationListProps {
  initialNotifications: Notification[];
  initialTotalPages: number;
  initialPage: number;
}

export function NotificationList({
  initialNotifications,
  initialTotalPages,
  initialPage,
}: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const router = useRouter();

  // 处理查看通知详情
  const handleView = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await markAsRead(notification.id);
        // 更新本地状态
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
        );
      } catch (error) {
        console.error("标记通知为已读失败:", error);
      }
    }

    if (notification.linkUrl) {
      router.push(notification.linkUrl);
    }
  };

  // 处理删除通知
  const handleDelete = async (notification: Notification) => {
    try {
      await deleteNotification(notification.id);
      // 更新本地状态
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (error) {
      console.error("删除通知失败:", error);
    }
  };

  // 处理标记所有为已读
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      // 更新本地状态
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error("标记所有通知为已读失败:", error);
    }
  };

  // 处理翻页
  const handlePageChange = (page: number) => {
    router.push(`/dashboard/notifications?page=${page}`);
  };

  // 获取通知类型对应的图标
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  // 获取通知类型对应的样式
  const getNotificationStyle = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "success":
        return "bg-green-50 border-green-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <div className="space-y-4">
      {notifications.length > 0 && (
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={handleMarkAllAsRead}
            className="text-sm"
          >
            标记所有为已读
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-40">
            <p className="text-muted-foreground">暂无通知</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`border ${
                !notification.read ? getNotificationStyle(notification.type) : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{notification.title}</h4>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm">{notification.message}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleView(notification)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(notification)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
} 