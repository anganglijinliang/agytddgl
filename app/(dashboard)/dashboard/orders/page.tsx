import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Plus, FileDown, FileUp, Search, Filter, LayoutGrid, LayoutList, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { OrdersTable } from "./components/orders-table";
import Link from "next/link";
import { getOrders } from "./actions";
import { withPermission } from "@/lib/rbac";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrdersKanban } from "./components/orders-kanban";
import { OrdersCalendar } from "./components/orders-calendar";

export const metadata = {
  title: "订单管理 | 安钢集团永通球墨铸铁管订单管理系统",
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  // 权限检查
  await withPermission("orders", "view");
  
  const page = searchParams.page ? parseInt(searchParams.page) : 1;
  const search = searchParams.search || "";
  const status = searchParams.status || "";
  const view = searchParams.view || "table";
  
  const { orders, totalCount, totalPages } = await getOrders({
    page,
    search,
    status,
  });

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <Heading
          title="订单管理"
          description="管理球墨铸铁管订单信息"
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileDown className="mr-2 h-4 w-4" />
            导出
          </Button>
          <Button variant="outline" size="sm">
            <FileUp className="mr-2 h-4 w-4" />
            导入
          </Button>
          <Button asChild>
            <Link href="/dashboard/orders/new">
              <Plus className="mr-2 h-4 w-4" />
              新建订单
            </Link>
          </Button>
        </div>
      </div>
      <Separator />
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索订单号、客户名称..."
            className="pl-8"
            defaultValue={search}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            筛选
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href={`/dashboard/orders?view=qrcode${search ? `&search=${search}` : ''}${status ? `&status=${status}` : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-qr-code"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue={view} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="table" asChild>
            <Link href={`/dashboard/orders?view=table${search ? `&search=${search}` : ''}${status ? `&status=${status}` : ''}`}>
              <LayoutList className="mr-2 h-4 w-4" />
              列表视图
            </Link>
          </TabsTrigger>
          <TabsTrigger value="kanban" asChild>
            <Link href={`/dashboard/orders?view=kanban${search ? `&search=${search}` : ''}${status ? `&status=${status}` : ''}`}>
              <LayoutGrid className="mr-2 h-4 w-4" />
              看板视图
            </Link>
          </TabsTrigger>
          <TabsTrigger value="calendar" asChild>
            <Link href={`/dashboard/orders?view=calendar${search ? `&search=${search}` : ''}${status ? `&status=${status}` : ''}`}>
              <Calendar className="mr-2 h-4 w-4" />
              日历视图
            </Link>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="table" className="mt-0">
          <OrdersTable
            orders={orders}
            pageCount={totalPages}
            currentPage={page}
          />
        </TabsContent>
        
        <TabsContent value="kanban" className="mt-0">
          <OrdersKanban orders={orders} />
        </TabsContent>
        
        <TabsContent value="calendar" className="mt-0">
          <OrdersCalendar orders={orders} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 