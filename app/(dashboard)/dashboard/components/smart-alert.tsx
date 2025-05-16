"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  AlertCircle, 
  Calendar, 
  Check, 
  Clock, 
  X, 
  AlertTriangle, 
  Info, 
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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

interface SmartAlertProps {
  alerts: AlertItem[];
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
  const [visibleAlerts, setVisibleAlerts] = useState<AlertItem[]>(alerts);
  const [activeTab, setActiveTab] = useState<string>("all");

  // 按照优先级排序提醒
  useEffect(() => {
    const sortedAlerts = [...alerts].sort((a, b) => b.priority - a.priority);
    setVisibleAlerts(sortedAlerts);
  }, [alerts]);

  // 过滤提醒列表
  const filteredAlerts = visibleAlerts.filter(alert => {
    if (activeTab === "all") return true;
    return alert.type === activeTab;
  });

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
      case "deadline":
        return <Calendar className="h-5 w-5 text-warning" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-warning" />;
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

  // 获取时间显示
  const getTimeDisplay = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 0) {
      return `已超期 ${Math.abs(diffInDays)} 天`;
    } else if (diffInDays === 0) {
      return "今天";
    } else if (diffInDays === 1) {
      return "明天";
    } else if (diffInDays < 7) {
      return `${diffInDays} 天后`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            智能提醒
          </CardTitle>
          <CardDescription>您的订单管理提醒</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6 text-muted-foreground">
            <p>当前没有需要注意的提醒</p>
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
          <Badge variant="outline">{alerts.length}</Badge>
        </div>
        <CardDescription>优先处理紧急订单和临近交期订单</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="px-6 pt-2">
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">全部</TabsTrigger>
              <TabsTrigger value="urgent" className="flex-1">紧急</TabsTrigger>
              <TabsTrigger value="deadline" className="flex-1">交期</TabsTrigger>
              <TabsTrigger value="info" className="flex-1">通知</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="all" className="mt-0">
            <div className="space-y-1 p-2 max-h-[320px] overflow-y-auto">
              {filteredAlerts.length === 0 ? (
                <div className="flex items-center justify-center p-6 text-muted-foreground">
                  <p>当前分类没有提醒</p>
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-start p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent",
                      getAlertColor(alert.type),
                      alert.isNew && "border-l-[3px]"
                    )}
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
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {getTimeDisplay(alert.date)}
                          </span>
                          {onDismiss && (
                            <button
                              onClick={(e) => handleDismiss(e, alert.id)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="urgent" className="mt-0">
            <div className="space-y-1 p-2 max-h-[320px] overflow-y-auto">
              {filteredAlerts.length === 0 ? (
                <div className="flex items-center justify-center p-6 text-muted-foreground">
                  <p>当前没有紧急提醒</p>
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-start p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent",
                      getAlertColor(alert.type),
                      alert.isNew && "border-l-[3px]"
                    )}
                    onClick={() => handleAlertClick(alert)}
                  >
                    <div className="mr-2 mt-0.5">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1 ml-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {getTimeDisplay(alert.date)}
                          </span>
                          {onDismiss && (
                            <button
                              onClick={(e) => handleDismiss(e, alert.id)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="deadline" className="mt-0">
            <div className="space-y-1 p-2 max-h-[320px] overflow-y-auto">
              {filteredAlerts.length === 0 ? (
                <div className="flex items-center justify-center p-6 text-muted-foreground">
                  <p>当前没有临近交期提醒</p>
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-start p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent",
                      getAlertColor(alert.type),
                      alert.isNew && "border-l-[3px]"
                    )}
                    onClick={() => handleAlertClick(alert)}
                  >
                    <div className="mr-2 mt-0.5">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1 ml-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {getTimeDisplay(alert.date)}
                          </span>
                          {onDismiss && (
                            <button
                              onClick={(e) => handleDismiss(e, alert.id)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="info" className="mt-0">
            <div className="space-y-1 p-2 max-h-[320px] overflow-y-auto">
              {filteredAlerts.length === 0 ? (
                <div className="flex items-center justify-center p-6 text-muted-foreground">
                  <p>当前没有通知提醒</p>
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-start p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent",
                      getAlertColor(alert.type),
                      alert.isNew && "border-l-[3px]"
                    )}
                    onClick={() => handleAlertClick(alert)}
                  >
                    <div className="mr-2 mt-0.5">
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1 ml-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {getTimeDisplay(alert.date)}
                          </span>
                          {onDismiss && (
                            <button
                              onClick={(e) => handleDismiss(e, alert.id)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t px-6 py-3">
        <Button variant="ghost" size="sm" className="w-full" onClick={onViewAll}>
          查看所有提醒
        </Button>
      </CardFooter>
    </Card>
  );
} 