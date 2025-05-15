"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ProductionStatus, ShiftType, TeamType } from "@prisma/client";
import { ProductionWithDetails } from "@/types/extended-types";
import { createProduction, updateProduction, getDropdownData } from "../actions";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  subOrderId: z.string().min(1, "订单项目为必填项"),
  status: z.nativeEnum(ProductionStatus),
  team: z.nativeEnum(TeamType),
  shift: z.nativeEnum(ShiftType),
  quantity: z.coerce.number().min(1, "数量必须大于0"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().optional(),
});

type ProductionFormValues = z.infer<typeof formSchema>;

interface ProductionFormProps {
  initialData?: ProductionWithDetails;
  initialValues?: { subOrderId?: string };
}

type DropdownOption = {
  id: string;
  label: string;
  plannedQuantity: number;
  produced: number;
};

export const ProductionForm: React.FC<ProductionFormProps> = ({
  initialData,
  initialValues = {}
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dropdownData, setDropdownData] = useState<{
    subOrders: DropdownOption[];
  }>({
    subOrders: [],
  });

  const form = useForm<ProductionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      subOrderId: initialData.subOrderId,
      status: initialData.status as ProductionStatus,
      team: initialData.team as TeamType,
      shift: initialData.shift as ShiftType,
      quantity: initialData.quantity,
      startTime: initialData.startTime ? format(new Date(initialData.startTime), "yyyy-MM-dd'T'HH:mm") : undefined,
      endTime: initialData.endTime ? format(new Date(initialData.endTime), "yyyy-MM-dd'T'HH:mm") : undefined,
      notes: initialData.notes || "",
    } : {
      subOrderId: initialValues.subOrderId || "",
      status: ProductionStatus.NOT_STARTED,
      team: TeamType.TEAM_A,
      shift: ShiftType.DAY_SHIFT,
      quantity: 0,
      startTime: "",
      endTime: "",
      notes: "",
    },
  });

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const data = await getDropdownData();
        setDropdownData(data);
        
        // 如果有指定的subOrderId并且没有初始数据，自动选择该子订单
        if (initialValues.subOrderId && !initialData) {
          form.setValue("subOrderId", initialValues.subOrderId);
        }
      } catch (error) {
        console.error("获取下拉选项数据失败:", error);
        toast.error("获取下拉选项数据失败");
      }
    };

    if (!initialData) {
      fetchDropdownData();
    }
  }, [initialData, initialValues.subOrderId, form]);

  const onSubmit = async (data: ProductionFormValues) => {
    try {
      setLoading(true);
      
      if (initialData) {
        // 更新生产记录
        const result = await updateProduction(initialData.id, data);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("生产记录更新成功");
      } else {
        // 创建新生产记录
        const result = await createProduction(data);
        if (result.error) {
          toast.error(result.error);
          return;
        }
        toast.success("生产记录创建成功");
        router.push("/dashboard/production");
      }
    } catch (error) {
      console.error(error);
      toast.error("操作失败");
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: ProductionStatus.NOT_STARTED, label: "未开始" },
    { value: ProductionStatus.IN_PROGRESS, label: "进行中" },
    { value: "COMPLETED", label: "已完成" },
    { value: "PAUSED", label: "已暂停" },
  ];

  const teamOptions = [
    { value: TeamType.TEAM_A, label: "A班组" },
    { value: TeamType.TEAM_B, label: "B班组" },
    { value: TeamType.TEAM_C, label: "C班组" },
    { value: TeamType.TEAM_D, label: "D班组" },
  ];

  const shiftOptions = [
    { value: ShiftType.DAY_SHIFT, label: "白班" },
    { value: ShiftType.NIGHT_SHIFT, label: "夜班" },
    { value: ShiftType.MIDDLE_SHIFT, label: "中班" },
  ];

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
                  disabled={loading || !!initialValues.subOrderId}
                  onValueChange={field.onChange}
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
                  选择要生产的订单项目
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>状态</FormLabel>
                <Select
                  disabled={loading}
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map((option) => (
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
            name="team"
            render={({ field }) => (
              <FormItem>
                <FormLabel>生产班组</FormLabel>
                <Select
                  disabled={loading}
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择班组" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {teamOptions.map((option) => (
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
            name="shift"
            render={({ field }) => (
              <FormItem>
                <FormLabel>班次</FormLabel>
                <Select
                  disabled={loading}
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择班次" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {shiftOptions.map((option) => (
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
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>生产数量</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    disabled={loading}
                    placeholder="输入数量"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>开始时间</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>结束时间</FormLabel>
                <FormControl>
                  <Input
                    type="datetime-local"
                    disabled={loading}
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
          {initialData ? "更新生产记录" : "创建生产记录"}
        </Button>
      </form>
    </Form>
  );
}; 