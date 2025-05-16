import { getProduction, getDropdownData } from "../actions";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { ProductionForm } from "../components/production-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";

interface ProductionDetailsPageProps {
  params: {
    id: string;
  };
}

const ProductionDetailsPage = async ({ params }: ProductionDetailsPageProps) => {
  const production = await getProduction(params.id);

  if (!production) {
    notFound();
  }
  
  // 获取下拉菜单数据（生产线和子订单）
  const dropdownData = await getDropdownData();
  
  // 获取所有生产线
  const productionLines = await db.productionLine.findMany();
  
  // 获取完整的子订单数据（包括包裹生产信息）
  const subOrders = await db.subOrder.findMany({
    where: {
      id: {
        in: [...dropdownData.subOrders.map(so => so.id), production.subOrder.id]
      }
    },
    include: {
      order: {
        include: {
          customer: true
        }
      },
      production: true
    }
  });
  
  // 格式化子订单数据以符合生产表单的要求
  const formattedSubOrders = subOrders.map(subOrder => {
    const producedQuantity = subOrder.production.reduce((sum, p) => sum + p.quantity, 0);
    const progress = Math.round((producedQuantity / subOrder.plannedQuantity) * 100);
    const remainingQuantity = subOrder.plannedQuantity - producedQuantity;
    
    return {
      id: subOrder.id,
      specification: subOrder.specification,
      grade: subOrder.grade,
      plannedQuantity: subOrder.plannedQuantity,
      producedQuantity,
      progress,
      remainingQuantity,
      productionLineId: subOrder.productionLineId,
      label: `${subOrder.order.orderNumber} - ${subOrder.order.customer.name} - ${subOrder.specification}`,
      order: {
        orderNumber: subOrder.order.orderNumber,
        customer: {
          name: subOrder.order.customer.name
        }
      }
    };
  });

  const statusMap: Record<string, { text: string; variant: "destructive" | "outline" | "secondary" | "default" }> = {
    NOT_STARTED: { text: "未开始", variant: "outline" },
    IN_PROGRESS: { text: "进行中", variant: "default" },
    COMPLETED: { text: "已完成", variant: "secondary" },
    PAUSED: { text: "已暂停", variant: "destructive" },
  };

  const shiftMap = {
    NIGHT_SHIFT: "夜班",
    DAY_SHIFT: "白班",
    MIDDLE_SHIFT: "中班",
  };

  const statusInfo = statusMap[production.status] || { text: production.status, variant: "outline" };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading title="生产记录详情" description={`订单号: ${production.subOrder.order.orderNumber}`} />
        <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
      </div>
      <Separator />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>订单信息</CardTitle>
            <CardDescription>订单和生产基本信息</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-gray-100">
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium text-gray-500">订单号</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {production.subOrder.order.orderNumber}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium text-gray-500">客户</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {production.subOrder.order.customer.name}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium text-gray-500">规格</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {production.subOrder.specification}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium text-gray-500">生产线</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {production.subOrder.productionLine?.name || "未分配"}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium text-gray-500">生产班组</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {production.team}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium text-gray-500">班次</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {shiftMap[production.shift as keyof typeof shiftMap] || production.shift}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>生产数据</CardTitle>
            <CardDescription>生产数量和时间信息</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-gray-100">
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium text-gray-500">计划数量</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {production.subOrder.plannedQuantity}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium text-gray-500">生产数量</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {production.quantity}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium text-gray-500">开始时间</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {production.startTime 
                    ? format(new Date(production.startTime), 'yyyy-MM-dd HH:mm:ss')
                    : "未记录"}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium text-gray-500">结束时间</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {production.endTime 
                    ? format(new Date(production.endTime), 'yyyy-MM-dd HH:mm:ss')
                    : "未记录"}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium text-gray-500">记录人员</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {production.user.name || production.user.email}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium text-gray-500">记录时间</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {format(new Date(production.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {production.notes && (
        <Card>
          <CardHeader>
            <CardTitle>备注</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{production.notes}</p>
          </CardContent>
        </Card>
      )}

      <Separator className="my-6" />
      
      <div>
        <Heading title="编辑生产记录" description="修改生产记录信息" />
        <div className="mt-4">
          <ProductionForm 
            initialData={production}
            productionLines={productionLines}
            subOrders={formattedSubOrders} 
          />
        </div>
      </div>
    </div>
  );
};

export default ProductionDetailsPage; 