"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileBarChart, Factory, TruckIcon, Package, Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

// 硬编码的静态数据
const statistics = {
  totalOrders: 124,
  inProduction: 38,
  pendingShipment: 27,
  completed: 76
};

// 静态订单示例数据
const orders = [
  {
    id: "1",
    orderNumber: "ORD-2023-1001",
    customerName: "河南建设集团",
    date: "2023-12-15",
    status: "processing",
    amount: 250000,
  },
  {
    id: "2",
    orderNumber: "ORD-2023-1002",
    customerName: "郑州市政工程",
    date: "2023-12-14",
    status: "shipped",
    amount: 135000,
  },
  {
    id: "3",
    orderNumber: "ORD-2023-1003",
    customerName: "安阳建筑公司",
    date: "2023-12-12",
    status: "completed",
    amount: 420000,
  },
];

export function DashboardStatic() {
  const router = useRouter();
  
  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">仪表盘 (静态版本)</h2>
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
            <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
              静态图表区域
            </div>
          </CardContent>
        </Card>
      
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  智能提醒
                </CardTitle>
                <Badge variant="outline">3</Badge>
              </div>
              <CardDescription>优先处理紧急订单和临近交期订单</CardDescription>
            </CardHeader>
            <CardContent className="p-2">
              <div className="space-y-2">
                <div className="bg-destructive/10 p-3 rounded-lg border">
                  <h4 className="font-medium text-sm">紧急订单待处理</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    订单ORD-2023-5001需要立即处理
                  </p>
                </div>
                <div className="bg-warning/10 p-3 rounded-lg border">
                  <h4 className="font-medium text-sm">订单交期临近</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    有3个订单将在本周内到达交付期限
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单号</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">金额</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {order.customerName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span>{order.customerName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === "completed"
                            ? "default"
                            : order.status === "processing"
                            ? "secondary"
                            : order.status === "shipped"
                            ? "success"
                            : "outline"
                        }
                      >
                        {order.status === "completed"
                          ? "已完成"
                          : order.status === "processing"
                          ? "生产中"
                          : order.status === "shipped"
                          ? "已发运"
                          : "待处理"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {`¥${order.amount.toLocaleString('zh-CN')}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 