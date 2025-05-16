"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { TransportationType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { createShipping } from "../actions";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

// 定义运输方式选项
const transportOptions = [
  { value: TransportationType.TRUCK, label: "汽运" },
  { value: TransportationType.TRAIN, label: "火车" },
  { value: TransportationType.SHIP, label: "船运" },
  { value: TransportationType.OTHER, label: "其他" },
];

// 定义发运记录表单架构
const shippingFormSchema = z.object({
  subOrderId: z.string({
    required_error: "请选择子订单",
  }),
  warehouseId: z.string({
    required_error: "请选择仓库",
  }),
  shippingDate: z.date({
    required_error: "请选择发运日期",
  }),
  transportType: z.nativeEnum(TransportationType, {
    required_error: "请选择运输方式",
  }),
  carrierName: z.string().optional(),
  vehicleInfo: z.string().optional(),
  driverInfo: z.string().optional(),
  shippingNumber: z.string().optional(),
  quantity: z.coerce
    .number({
      required_error: "请输入发运支数",
      invalid_type_error: "请输入有效的数字",
    })
    .min(1, { message: "发运支数必须大于0" }),
  destinationInfo: z.string().optional(),
  estimatedArrival: z.date().optional(),
  notes: z.string().optional(),
});

export type ShippingFormValues = z.infer<typeof shippingFormSchema>;

// 子订单类型
type SubOrder = {
  id: string;
  specification: string;
  grade: string;
  plannedQuantity: number;
  producedQuantity: number;
  shippedQuantity: number; 
  progress: number;
  shippingProgress: number;
  remainingQuantity: number;
  label: string;
  warehouseId?: string | null;
  order: {
    orderNumber: string;
    customer: {
      name: string;
    };
  };
};

// 仓库类型
type Warehouse = {
  id: string;
  name: string;
  location?: string | null;
};

interface ShippingFormProps {
  warehouses: Warehouse[];
  subOrders: SubOrder[];
}

export function ShippingForm({
  warehouses,
  subOrders,
}: ShippingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubOrder, setSelectedSubOrder] = useState<SubOrder | null>(null);

  // 设置默认值
  const defaultValues: Partial<ShippingFormValues> = {
    shippingDate: new Date(),
    transportType: TransportationType.TRUCK,
  };

  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues,
  });

  // 当子订单改变时更新选中的子订单
  const handleSubOrderChange = (value: string) => {
    form.setValue("subOrderId", value);
    const selected = subOrders.find((subOrder) => subOrder.id === value);
    setSelectedSubOrder(selected || null);

    // 如果子订单有默认仓库，则自动选择
    if (selected?.warehouseId) {
      form.setValue("warehouseId", selected.warehouseId);
    }
  };

  async function onSubmit(data: ShippingFormValues) {
    try {
      setIsLoading(true);
      
      // 检查数量是否超过可发运数量
      if (selectedSubOrder && data.quantity > selectedSubOrder.remainingQuantity) {
        toast.error(`发运支数不能超过剩余可发运支数 ${selectedSubOrder.remainingQuantity}`);
        return;
      }
      
      // 发送请求
      const result = await createShipping(data);
      
      if (result.success) {
        toast.success("发运记录创建成功");
        router.push("/dashboard/shipping");
        router.refresh();
      } else {
        toast.error(result.message || "创建失败，请重试");
      }
    } catch (error) {
      toast.error("提交过程中出现错误");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="subOrderId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>选择订单规格</FormLabel>
                <Select
                  disabled={isLoading}
                  onValueChange={handleSubOrderChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择订单规格" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {subOrders.map((subOrder) => (
                      <SelectItem key={subOrder.id} value={subOrder.id}>
                        {subOrder.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  选择需要记录发运进度的订单规格
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedSubOrder && (
            <Card className="md:col-span-2">
              <CardContent className="pt-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium">订单号</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedSubOrder.order.orderNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">客户</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedSubOrder.order.customer.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">规格 / 级别</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedSubOrder.specification} / {selectedSubOrder.grade}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">计划支数</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedSubOrder.plannedQuantity} 支
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">已发运</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedSubOrder.shippedQuantity} 支
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">可发运</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedSubOrder.remainingQuantity} 支
                    </p>
                  </div>
                  <div className="md:col-span-3">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">生产进度</span>
                      <span className="text-sm font-medium">{selectedSubOrder.progress}%</span>
                    </div>
                    <Progress value={selectedSubOrder.progress} className="h-2" />
                  </div>
                  <div className="md:col-span-3">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">发运进度</span>
                      <span className="text-sm font-medium">{selectedSubOrder.shippingProgress}%</span>
                    </div>
                    <Progress value={selectedSubOrder.shippingProgress} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <FormField
            control={form.control}
            name="warehouseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>仓库</FormLabel>
                <Select
                  disabled={isLoading}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择仓库" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} {warehouse.location ? `(${warehouse.location})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shippingDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>发运日期</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "yyyy-MM-dd")
                        ) : (
                          <span>选择日期</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="transportType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>运输方式</FormLabel>
                <Select
                  disabled={isLoading}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择运输方式" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {transportOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>发运支数</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="输入发运支数"
                    {...field}
                    min={1}
                    max={selectedSubOrder?.remainingQuantity}
                  />
                </FormControl>
                <FormDescription>
                  {selectedSubOrder
                    ? `最大可输入: ${selectedSubOrder.remainingQuantity} 支`
                    : "请先选择子订单"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="carrierName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>承运单位</FormLabel>
                <FormControl>
                  <Input placeholder="输入承运单位名称" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vehicleInfo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>车辆信息</FormLabel>
                <FormControl>
                  <Input placeholder="输入车牌号/车次信息" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shippingNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>发运单号</FormLabel>
                <FormControl>
                  <Input placeholder="输入发运单号" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="driverInfo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>司机信息</FormLabel>
                <FormControl>
                  <Input placeholder="输入司机姓名和联系方式" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="destinationInfo"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>目的地信息</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="输入详细的目的地信息..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>备注</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="输入其他备注信息..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="mr-2"
            onClick={() => router.push("/dashboard/shipping")}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button type="submit" disabled={isLoading || !selectedSubOrder}>
            {isLoading ? "提交中..." : "保存发运记录"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 