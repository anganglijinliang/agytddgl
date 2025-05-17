"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Overview } from "@/components/dashboard/overview";
import { RecentOrders } from "./components/recent-orders";
import { SmartAlert } from "./components/smart-alert";
import { FileBarChart, Factory, TruckIcon, Package, Calendar, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

interface DashboardClientProps {
  // 如果有需要从服务端获取的初始数据，可以在这里定义
  initialData?: any;
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>({
    totalOrders: 0,
    inProduction: 0,
    pendingShipment: 0,
    completed: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // 初始化统计数据
  useEffect(() => {
    if (initialData) {
      setStatistics(initialData);
      setIsLoading(false);
    }
  }, [initialData]);

  // 获取提醒数据
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch('/api/alerts');
        if (response.ok) {
          const data = await response.json();
          setAlerts(data);
        } else {
          console.error('获取提醒失败，使用示例数据');
          // 使用组件内部示例数据
          setAlerts([]);
        }
      } catch (error) {
        console.error('获取提醒出错:', error);
        // 发生错误时使用空数组，避免重复请求
        setAlerts([]);
      }
    };

    fetchAlerts();
    
    if (!initialData) {
      const fetchStatistics = async () => {
        try {
          // 这里实际项目中应当有一个专门的API获取统计数据
          // 失败时直接使用示例数据
          setStatistics({
            totalOrders: 124,
            inProduction: 38,
            pendingShipment: 27,
            completed: 76
          });
        } catch (error) {
          console.error('获取统计数据出错:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchStatistics();
    }
  }, [initialData]);

  // 处理关闭提醒
  const handleDismissAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
    toast({
      title: "提醒已关闭",
      description: "该提醒已从列表中移除",
    });
  };

  // 处理已读提醒
  const handleMarkAlertRead = async (id: string) => {
    try {
      // 实际应用中应当有一个API来标记已读
      // 这里仅作示例
      const updatedAlerts = alerts.map(alert => 
        alert.id === id ? { ...alert, isNew: false } : alert
      );
      setAlerts(updatedAlerts);
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 处理查看所有提醒
  const handleViewAllAlerts = () => {
    router.push('/dashboard/notifications');
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">仪表盘</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.refresh()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <Skeleton className="h-[120px] w-full" />
            <Skeleton className="h-[120px] w-full" />
            <Skeleton className="h-[120px] w-full" />
            <Skeleton className="h-[120px] w-full" />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总订单数</CardTitle>
                <FileBarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  包含所有状态的订单
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">生产中</CardTitle>
                <Factory className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.inProduction}</div>
                <p className="text-xs text-muted-foreground">
                  当前正在生产的订单
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">待发运</CardTitle>
                <TruckIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.pendingShipment}</div>
                <p className="text-xs text-muted-foreground">
                  待发运或部分发运
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">已完成</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statistics.completed}</div>
                <p className="text-xs text-muted-foreground">
                  已完成的订单
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>订单趋势</CardTitle>
            <CardDescription>
              近期订单创建和完成情况
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <Overview />
            )}
          </CardContent>
        </Card>
      
        <div className="lg:col-span-2">
          {isLoading ? (
            <Skeleton className="h-[450px] w-full" />
          ) : (
            <SmartAlert 
              alerts={alerts} 
              onDismiss={handleDismissAlert}
              onMarkRead={handleMarkAlertRead}
              onViewAll={handleViewAllAlerts}
            />
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>近期订单</CardTitle>
            <CardDescription>
              最近创建和更新的订单
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <RecentOrders />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>待交货订单</CardTitle>
            <CardDescription>
              未来7天内需要交付的订单
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center border-b pb-2">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="grid flex-1 grid-cols-2 gap-1">
                    <div className="text-sm font-medium">日期</div>
                    <div className="text-sm font-medium text-right">订单数</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="grid flex-1 grid-cols-2 gap-1">
                      <div className="text-sm">今天</div>
                      <div className="text-sm font-medium text-right">5</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="grid flex-1 grid-cols-2 gap-1">
                      <div className="text-sm">明天</div>
                      <div className="text-sm font-medium text-right">3</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="grid flex-1 grid-cols-2 gap-1">
                      <div className="text-sm">2天后</div>
                      <div className="text-sm font-medium text-right">7</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="grid flex-1 grid-cols-2 gap-1">
                      <div className="text-sm">3天后</div>
                      <div className="text-sm font-medium text-right">4</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="grid flex-1 grid-cols-2 gap-1">
                      <div className="text-sm">4天后</div>
                      <div className="text-sm font-medium text-right">6</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="grid flex-1 grid-cols-2 gap-1">
                      <div className="text-sm">5天后</div>
                      <div className="text-sm font-medium text-right">2</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="grid flex-1 grid-cols-2 gap-1">
                      <div className="text-sm">6天后</div>
                      <div className="text-sm font-medium text-right">3</div>
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href="/dashboard/orders?view=calendar">查看日历视图</a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 