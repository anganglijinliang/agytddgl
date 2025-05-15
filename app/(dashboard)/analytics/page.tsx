"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { format, subMonths } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

// 订单状态的颜色映射
const statusColorMap = {
  DRAFT: "#94a3b8",
  CONFIRMED: "#3b82f6",
  IN_PRODUCTION: "#f59e0b",
  PARTIALLY_SHIPPED: "#8b5cf6",
  COMPLETED: "#22c55e",
  CANCELED: "#ef4444",
};

// 订单状态的中文映射
const statusTextMap = {
  DRAFT: "草稿",
  CONFIRMED: "已确认",
  IN_PRODUCTION: "生产中",
  PARTIALLY_SHIPPED: "部分发货",
  COMPLETED: "已完成",
  CANCELED: "已取消",
};

// 分析数据类型定义
interface AnalyticsData {
  overview: {
    totalOrders: number;
    completedOrders: number;
    completionRate: number;
    totalProduction: number;
    totalShipping: number;
    shippingRate: number;
  };
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
  productionData: Array<Record<string, any>>;
  shippingData: Array<Record<string, any>>;
  transportShares: {
    汽运: number;
    火车: number;
    船运: number;
    其他: number;
  };
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#FF6B6B"];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<DateRange>({
    from: subMonths(new Date(), 3),
    to: new Date(),
  });
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    overview: {
      totalOrders: 0,
      completedOrders: 0,
      completionRate: 0,
      totalProduction: 0,
      totalShipping: 0,
      shippingRate: 0,
    },
    ordersByStatus: [],
    productionData: [],
    shippingData: [],
    transportShares: {
      汽运: 0,
      火车: 0,
      船运: 0,
      其他: 0,
    },
  });

  // 获取分析数据
  const fetchData = async () => {
    if (!date?.from || !date?.to) return;
    
    setLoading(true);
    try {
      const from = format(date.from, "yyyy-MM-dd");
      const to = format(date.to, "yyyy-MM-dd");
      
      const response = await fetch(
        `/api/analytics?from=${from}&to=${to}`
      );
      
      if (!response.ok) {
        throw new Error("获取数据失败");
      }
      
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error("获取分析数据出错:", error);
    } finally {
      setLoading(false);
    }
  };

  // 当日期改变时获取数据
  useEffect(() => {
    if (date?.from && date?.to) {
      fetchData();
    }
  }, [date]);

  // 处理订单状态数据以用于饼图
  const orderStatusChartData = analyticsData.ordersByStatus.map((item) => ({
    name: statusTextMap[item.status as keyof typeof statusTextMap] || item.status,
    value: item.count,
    color: statusColorMap[item.status as keyof typeof statusColorMap] || "#CBD5E1",
  }));

  const handleDateChange = (newDate: DateRange | undefined) => {
    if (newDate) {
      setDate(newDate);
    }
  };

  return (
    <div className="space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">数据分析</h2>
        <div className="flex items-center gap-4">
          <DatePickerWithRange 
            date={date} 
            setDate={handleDateChange} 
          />
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">总览</TabsTrigger>
          <TabsTrigger value="production">生产分析</TabsTrigger>
          <TabsTrigger value="shipping">发运分析</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总订单数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  近期趋势：增长
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">已完成订单</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.completedOrders}</div>
                <p className="text-xs text-muted-foreground">
                  占比 {analyticsData.overview.completionRate}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">生产总量</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.totalProduction}</div>
                <p className="text-xs text-muted-foreground">
                  稳定增长
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">发运总量</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.totalShipping}</div>
                <p className="text-xs text-muted-foreground">
                  占生产总量的 {analyticsData.overview.shippingRate}%
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>订单状态分布</CardTitle>
                <CardDescription>
                  各状态订单数量占比
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                  {loading ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : orderStatusChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={orderStatusChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {orderStatusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      无订单数据
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>每月订单趋势</CardTitle>
                <CardDescription>
                  按月份和规格统计
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] w-full">
                  {loading ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : analyticsData.productionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.productionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {Object.keys(analyticsData.productionData[0] || {})
                          .filter(key => key !== 'month')
                          .map((key, index) => (
                            <Bar 
                              key={key} 
                              dataKey={key} 
                              stackId="a" 
                              fill={COLORS[index % COLORS.length]} 
                            />
                          ))}
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      无生产数据
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="production" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">生产线效率</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87.5%</div>
                <p className="text-xs text-muted-foreground">
                  同比提升 +5.2%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均生产周期</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3.5天</div>
                <p className="text-xs text-muted-foreground">
                  同比缩短 0.8天
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">维修停机时间</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12小时</div>
                <p className="text-xs text-muted-foreground">
                  同比减少 25%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">质量合格率</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">99.2%</div>
                <p className="text-xs text-muted-foreground">
                  同比提高 0.5%
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>生产量趋势（按规格）</CardTitle>
              <CardDescription>
                各规格产品月度生产趋势
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                {loading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : analyticsData.productionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.productionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {Object.keys(analyticsData.productionData[0] || {})
                        .filter(key => key !== 'month')
                        .map((key, index) => (
                          <Bar 
                            key={key} 
                            dataKey={key} 
                            fill={COLORS[index % COLORS.length]} 
                          />
                        ))}
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    无生产数据
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="shipping" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">汽运占比</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.transportShares.汽运}%</div>
                <p className="text-xs text-muted-foreground">
                  主要运输方式
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">火车运输占比</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.transportShares.火车}%</div>
                <p className="text-xs text-muted-foreground">
                  适用于长距离运输
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">船运占比</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.transportShares.船运}%</div>
                <p className="text-xs text-muted-foreground">
                  适用于出口订单
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均配送时间</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.8天</div>
                <p className="text-xs text-muted-foreground">
                  稳步提升
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>发运量趋势（按运输方式）</CardTitle>
              <CardDescription>
                不同运输方式的月度发运趋势
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                {loading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : analyticsData.shippingData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.shippingData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="汽运" fill="#8884d8" />
                      <Bar dataKey="火车" fill="#82ca9d" />
                      <Bar dataKey="船运" fill="#ffc658" />
                      <Bar dataKey="其他" fill="#ff8042" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    无发运数据
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 