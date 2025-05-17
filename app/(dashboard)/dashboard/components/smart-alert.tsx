"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  AlertCircle, 
  Bell,
  Info, 
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type AlertItem = {
  id: string;
  type: "urgent" | "deadline" | "info" | "warning";
  title: string;
  description: string;
  link?: string;
  date: Date;
  priority: number;
  isNew?: boolean;
};

// 示例提醒数据
const sampleAlerts: AlertItem[] = [
  {
    id: "1",
    type: "urgent",
    title: "紧急订单待处理",
    description: "订单ORD-2023-5001需要立即处理，客户要求加急发货",
    date: new Date(),
    priority: 10,
    isNew: true,
  },
  {
    id: "2",
    type: "deadline",
    title: "订单交期临近",
    description: "有3个订单将在本周内到达交付期限",
    link: "/dashboard/orders?filter=deadline",
    date: new Date(),
    priority: 8,
  },
  {
    id: "3",
    type: "info",
    title: "系统更新通知",
    description: "系统将于本周日进行维护更新，届时将暂停服务2小时",
    date: new Date(),
    priority: 5,
  }
];

interface SmartAlertProps {
  alerts?: AlertItem[];
  onDismiss?: (id: string) => void;
  onMarkRead?: (id: string) => void;
  onViewAll?: () => void;
}

export function SmartAlert({ 
  alerts = [], 
  onDismiss, 
  onMarkRead,
  onViewAll
}: SmartAlertProps) {
  const router = useRouter();
  const [visibleAlerts, setVisibleAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化并按优先级排序提醒
  useEffect(() => {
    if (alerts && alerts.length > 0) {
    const sortedAlerts = [...alerts].sort((a, b) => b.priority - a.priority);
    setVisibleAlerts(sortedAlerts);
    } else {
      // 如果没有提供提醒数据，使用示例数据
      setVisibleAlerts(sampleAlerts);
    }
    setIsLoading(false);
  }, [alerts]);

  // 处理提醒点击
  const handleAlertClick = (alert: AlertItem) => {
    if (alert.link) {
      router.push(alert.link);
    }
    
    if (onMarkRead && alert.isNew) {
      onMarkRead(alert.id);
    }
  };

  // 处理关闭提醒
  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    if (onDismiss) {
      onDismiss(id);
      setVisibleAlerts(visibleAlerts.filter(alert => alert.id !== id));
    }
  };

  // 获取提醒图标
  const getAlertIcon = (type: string) => {
    switch (type) {
      case "urgent":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  // 获取提醒颜色
  const getAlertColor = (type: string) => {
    switch (type) {
      case "urgent":
        return "border-destructive/50 bg-destructive/10";
      case "deadline":
        return "border-warning/50 bg-warning/10";
      case "warning":
        return "border-warning/50 bg-warning/10";
      default:
        return "border-primary/50 bg-primary/5";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            智能提醒
          </CardTitle>
          <CardDescription>加载中...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px]">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            智能提醒
          </CardTitle>
          <Badge variant="outline">{visibleAlerts.length}</Badge>
        </div>
        <CardDescription>优先处理紧急订单和临近交期订单</CardDescription>
      </CardHeader>
      <CardContent className="p-2 max-h-[350px] overflow-y-auto">
        {visibleAlerts.length === 0 ? (
                <div className="flex items-center justify-center p-6 text-muted-foreground">
            <p>当前没有需要注意的提醒</p>
                </div>
              ) : (
          <div className="space-y-2">
            {visibleAlerts.map((alert) => (
                  <div
                    key={alert.id}
                className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${getAlertColor(alert.type)} ${alert.isNew ? "border-l-[3px]" : ""}`}
                    onClick={() => handleAlertClick(alert)}
                  >
                    <div className="mr-2 mt-0.5">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1 ml-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">
                          {alert.title}
                          {alert.isNew && (
                            <Badge variant="default" className="ml-2 text-[10px] px-1 py-0 h-4">
                              新
                            </Badge>
                          )}
                        </h4>
                          {onDismiss && (
                            <button
                        aria-label="关闭提醒"
                        title="关闭提醒"
                              onClick={(e) => handleDismiss(e, alert.id)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.description}
                      </p>
                    </div>
                  </div>
            ))}
                  </div>
              )}
      </CardContent>
      {visibleAlerts.length > 0 && (
        <CardFooter className="pt-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full" 
            onClick={onViewAll}
          >
          查看所有提醒
        </Button>
      </CardFooter>
      )}
    </Card>
  );
} 