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
import { TeamType, ShiftType, ProductionStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { createProduction } from "../actions";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

// 定义班组选项
const teamOptions = [
  { value: TeamType.TEAM_A, label: "甲班" },
  { value: TeamType.TEAM_B, label: "乙班" },
  { value: TeamType.TEAM_C, label: "丙班" },
  { value: TeamType.TEAM_D, label: "丁班" },
];

// 定义班次选项
const shiftOptions = [
  { value: ShiftType.DAY_SHIFT, label: "白班" },
  { value: ShiftType.MIDDLE_SHIFT, label: "中班" },
  { value: ShiftType.NIGHT_SHIFT, label: "夜班" },
];

// 定义生产记录表单架构
const productionFormSchema = z.object({
  subOrderId: z.string({
    required_error: "请选择子订单",
  }),
  productionLineId: z.string({
    required_error: "请选择生产线",
  }),
  team: z.nativeEnum(TeamType, {
    required_error: "请选择班组",
  }),
  shift: z.nativeEnum(ShiftType, {
    required_error: "请选择班次",
  }),
  productionDate: z.date({
    required_error: "请选择生产日期",
  }),
  quantity: z.coerce
    .number({
      required_error: "请输入生产支数",
      invalid_type_error: "请输入有效的数字",
    })
    .min(1, { message: "生产支数必须大于0" }),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  qualityNotes: z.string().optional(),
  materialUsage: z.string().optional(),
  notes: z.string().optional(),
});

export type ProductionFormValues = z.infer<typeof productionFormSchema>;

// 子订单类型
type SubOrder = {
  id: string;
  specification: string;
  grade: string;
  plannedQuantity: number;
  producedQuantity: number;
  progress: number;
  remainingQuantity: number;
  label: string;
  productionLineId?: string | null;
  order: {
    orderNumber: string;
    customer: {
      name: string;
    };
  };
};

// 生产线类型
type ProductionLine = {
  id: string;
  name: string;
  type: string;
};

interface ProductionFormProps {
  productionLines: ProductionLine[];
  subOrders: SubOrder[];
}

export function ProductionForm({
  productionLines,
  subOrders,
}: ProductionFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSubOrder, setSelectedSubOrder] = useState<SubOrder | null>(null);

  // 设置默认值
  const defaultValues: Partial<ProductionFormValues> = {
    productionDate: new Date(),
    team: TeamType.TEAM_A,
    shift: ShiftType.DAY_SHIFT,
  };

  const form = useForm<ProductionFormValues>({
    resolver: zodResolver(productionFormSchema),
    defaultValues,
  });

  // 当子订单改变时更新选中的子订单
  const handleSubOrderChange = (value: string) => {
    form.setValue("subOrderId", value);
    const selected = subOrders.find((subOrder) => subOrder.id === value);
    setSelectedSubOrder(selected || null);

    // 如果子订单有默认生产线，则自动选择
    if (selected?.productionLineId) {
      form.setValue("productionLineId", selected.productionLineId);
    }
  };

  async function onSubmit(data: ProductionFormValues) {
    try {
      setIsLoading(true);
      
      // 检查数量是否超过剩余数量
      if (selectedSubOrder && data.quantity > selectedSubOrder.remainingQuantity) {
        toast.error(`生产支数不能超过剩余计划支数 ${selectedSubOrder.remainingQuantity}`);
        return;
      }
      
      // 发送请求
      const result = await createProduction(data);
      
      if (result.success) {
        toast.success("生产记录创建成功");
        router.push("/dashboard/production");
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
                  选择需要记录生产进度的订单规格
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
                    <p className="text-sm font-medium">已生产</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedSubOrder.producedQuantity} 支
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">剩余</p>
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
                </div>
              </CardContent>
            </Card>
          )}

          <FormField
            control={form.control}
            name="productionLineId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>生产线</FormLabel>
                <Select
                  disabled={isLoading}
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择生产线" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {productionLines.map((line) => (
                      <SelectItem key={line.id} value={line.id}>
                        {line.name}
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
                <FormLabel>班组</FormLabel>
                <Select
                  disabled={isLoading}
                  onValueChange={field.onChange}
                  value={field.value}
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
                  disabled={isLoading}
                  onValueChange={field.onChange}
                  value={field.value}
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

          <FormField
            control={form.control}
            name="productionDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>生产日期</FormLabel>
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
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>生产支数</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="输入生产支数"
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
            name="qualityNotes"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>质量备注</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="输入质量相关备注信息..."
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
            name="materialUsage"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>材料使用</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="输入材料使用情况..."
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
                <FormLabel>其他备注</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="输入其他相关备注信息..."
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
            onClick={() => router.push("/dashboard/production")}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button type="submit" disabled={isLoading || !selectedSubOrder}>
            {isLoading ? "提交中..." : "保存生产记录"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 