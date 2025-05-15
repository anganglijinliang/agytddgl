"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TransportationType } from "@prisma/client";
import { ShippingWithDetails } from "@/types/extended-types";
import { createShipping, updateShipping, getDropdownData } from "../actions";
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
import { format } from "date-fns";
import { toast } from "sonner";

const formSchema = z.object({
  subOrderId: z.string().min(1, "订单项目为必填项"),
  quantity: z.coerce.number().min(1, "数量必须大于0"),
  shippingDate: z.string(),
  transportType: z.nativeEnum(TransportationType),
  shippingNumber: z.string().optional(),
  destinationInfo: z.string().min(1, "目的地地址为必填项"),
  driverInfo: z.string().min(1, "司机信息为必填项"),
  vehicleInfo: z.string().min(1, "车辆信息为必填项"),
  notes: z.string().optional(),
});

type ShippingFormValues = z.infer<typeof formSchema>;

interface ShippingFormProps {
  initialData?: ShippingWithDetails;
}

type DropdownOption = {
  id: string;
  label: string;
  produced: number;
  shipped: number;
  available: number;
};

export const ShippingForm: React.FC<ShippingFormProps> = ({
  initialData,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dropdownData, setDropdownData] = useState<{
    subOrders: DropdownOption[];
  }>({
    subOrders: [],
  });

  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      subOrderId: initialData.subOrderId,
      quantity: initialData.quantity,
      shippingDate: format(new Date(initialData.shippingDate), "yyyy-MM-dd"),
      transportType: initialData.transportType as TransportationType,
      shippingNumber: initialData.shippingNumber || "",
      destinationInfo: initialData.destinationInfo || "",
      driverInfo: initialData.driverInfo || "",
      vehicleInfo: initialData.vehicleInfo || "",
      notes: initialData.notes || "",
    } : {
      subOrderId: "",
      quantity: 0,
      shippingDate: format(new Date(), "yyyy-MM-dd"),
      transportType: TransportationType.TRUCK,
      shippingNumber: "",
      destinationInfo: "",
      driverInfo: "",
      vehicleInfo: "",
      notes: "",
    },
  });

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const data = await getDropdownData();
        setDropdownData(data);
      } catch (error) {
        console.error("获取下拉选项数据失败:", error);
        toast.error("获取下拉选项数据失败");
      }
    };

    if (!initialData) {
      fetchDropdownData();
    }
  }, [initialData]);

  const onSubOrderChange = (subOrderId: string) => {
    // 重置数量，根据当前选择的子订单设置最大可用数量
    form.setValue("subOrderId", subOrderId);
    const selectedSubOrder = dropdownData.subOrders.find(so => so.id === subOrderId);
    if (selectedSubOrder) {
      form.setValue("quantity", 0);
    }
  };

  const onSubmit = async (data: ShippingFormValues) => {
    try {
      setLoading(true);
      
      if (initialData) {
        // 更新发货记录
        const result = await updateShipping(initialData.id, data);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("发货记录更新成功");
      } else {
        // 创建新发货记录
        const result = await createShipping(data);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("发货记录创建成功");
        router.push("/dashboard/shipping");
      }
    } catch (error) {
      console.error(error);
      toast.error("操作失败");
    } finally {
      setLoading(false);
    }
  };

  const transportationOptions = [
    { value: TransportationType.TRUCK, label: "货车" },
    { value: TransportationType.TRAIN, label: "火车" },
    { value: TransportationType.SHIP, label: "轮船" },
    { value: TransportationType.OTHER, label: "其他" },
  ];

  const selectedSubOrderId = form.watch("subOrderId");
  const selectedSubOrder = dropdownData.subOrders.find(so => so.id === selectedSubOrderId);
  const maxAvailable = selectedSubOrder?.available || 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {!initialData && (
          <FormField
            control={form.control}
            name="subOrderId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>订单项目</FormLabel>
                <Select
                  disabled={loading}
                  onValueChange={(value) => onSubOrderChange(value)}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择订单项目" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {dropdownData.subOrders.map((subOrder) => (
                      <SelectItem key={subOrder.id} value={subOrder.id}>
                        {subOrder.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  选择要发货的订单项目
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>发货数量</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    disabled={loading}
                    placeholder="输入数量"
                    {...field}
                  />
                </FormControl>
                {selectedSubOrder && (
                  <FormDescription>
                    当前可发货数量: {maxAvailable}
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shippingDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>发货日期</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="transportType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>运输方式</FormLabel>
                <Select
                  disabled={loading}
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择运输方式" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {transportationOptions.map((option) => (
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
            name="shippingNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>运输单号</FormLabel>
                <FormControl>
                  <Input
                    disabled={loading}
                    placeholder="输入运输单号(可选)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="destinationInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>目的地地址</FormLabel>
              <FormControl>
                <Input
                  disabled={loading}
                  placeholder="输入详细地址"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="driverInfo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>联系人</FormLabel>
                <FormControl>
                  <Input
                    disabled={loading}
                    placeholder="输入联系人姓名"
                    {...field}
                  />
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
                <FormLabel>联系电话</FormLabel>
                <FormControl>
                  <Input
                    disabled={loading}
                    placeholder="输入联系电话"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>备注</FormLabel>
              <FormControl>
                <Textarea
                  disabled={loading}
                  placeholder="输入备注信息"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading}>
          {initialData ? "更新发货记录" : "创建发货记录"}
        </Button>
      </form>
    </Form>
  );
}; 