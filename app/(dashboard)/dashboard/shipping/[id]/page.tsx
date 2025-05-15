import { getShipping } from "../actions";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { ShippingForm } from "../components/shipping-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ShippingDetailsPageProps {
  params: {
    id: string;
  };
}

const ShippingDetailsPage = async ({ params }: ShippingDetailsPageProps) => {
  const shipping = await getShipping(params.id);

  if (!shipping) {
    notFound();
  }

  const transportationMap = {
    TRAIN: "火车",
    TRUCK: "货车",
    SHIP: "轮船",
    OTHER: "其他",
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading title="发货记录详情" description={`订单号: ${shipping.subOrder.order.orderNumber}`} />
      </div>
      <Separator />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>订单信息</CardTitle>
            <CardDescription>订单和发货基本信息</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-gray-100">
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium text-gray-500">订单号</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {shipping.subOrder.order.orderNumber}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium text-gray-500">客户</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {shipping.subOrder.order.customer.name}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium text-gray-500">规格</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {shipping.subOrder.specification}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium text-gray-500">仓库</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {shipping.subOrder.warehouse?.name || "未分配"}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium text-gray-500">发货数量</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {shipping.quantity}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium text-gray-500">发货日期</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {format(new Date(shipping.shippingDate), 'yyyy-MM-dd')}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>运输信息</CardTitle>
            <CardDescription>运输方式和联系信息</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-gray-100">
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium text-gray-500">运输方式</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {transportationMap[shipping.transportType as keyof typeof transportationMap] || shipping.transportType}
                </dd>
              </div>
              {shipping.shippingNumber && (
                <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                  <dt className="text-sm font-medium text-gray-500">运输单号</dt>
                  <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                    {shipping.shippingNumber}
                  </dd>
                </div>
              )}
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium text-gray-500">目的地地址</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {shipping.destinationInfo}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium text-gray-500">联系人</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {shipping.driverInfo}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium text-gray-500">联系电话</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {shipping.vehicleInfo}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium text-gray-500">记录人员</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {shipping.user.name || shipping.user.email}
                </dd>
              </div>
              <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium text-gray-500">记录时间</dt>
                <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                  {format(new Date(shipping.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {shipping.notes && (
        <Card>
          <CardHeader>
            <CardTitle>备注</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{shipping.notes}</p>
          </CardContent>
        </Card>
      )}

      <Separator className="my-6" />
      
      <div>
        <Heading title="编辑发货记录" description="修改发货记录信息" />
        <div className="mt-4">
          <ShippingForm 
            initialData={shipping} 
          />
        </div>
      </div>
    </div>
  );
};

export default ShippingDetailsPage; 