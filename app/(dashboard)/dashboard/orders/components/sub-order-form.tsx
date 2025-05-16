"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatDate } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { subOrderSchema } from "@/lib/request-schema";
import { createSubOrder, getDropdownData } from "../actions";
import { Label as UILabel } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ProductionLineType, PriorityLevel } from "@prisma/client";

interface SubOrderFormProps {
  orderId: string;
}

type DropdownOption = {
  id: string;
  value: string;
};

// 优先级选项
const priorityOptions = [
  { value: PriorityLevel.LOW, label: "低" },
  { value: PriorityLevel.NORMAL, label: "正常" },
  { value: PriorityLevel.HIGH, label: "高" },
  { value: PriorityLevel.URGENT, label: "紧急" },
  { value: PriorityLevel.CRITICAL, label: "关键" },
];

// 产线选项
const productionLineOptions = [
  { value: ProductionLineType.WORKSHOP_ONE, label: "一车间" },
  { value: ProductionLineType.WORKSHOP_TWO, label: "二车间" },
  { value: ProductionLineType.WORKSHOP_THREE, label: "三车间" },
];

export function SubOrderForm({ orderId }: SubOrderFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownData, setDropdownData] = useState<{
    specifications: DropdownOption[];
    grades: DropdownOption[];
    interfaceTypes: DropdownOption[];
    linings: DropdownOption[];
    lengths: DropdownOption[];
    anticorrosions: DropdownOption[];
    productionLines: DropdownOption[];
    warehouses: DropdownOption[];
  }>({
    specifications: [],
    grades: [],
    interfaceTypes: [],
    linings: [],
    lengths: [],
    anticorrosions: [],
    productionLines: [],
    warehouses: [],
  });

  // 获取下拉数据
  useEffect(() => {
    async function loadDropdownData() {
      try {
        const data = await getDropdownData();
        setDropdownData(data);
      } catch (error) {
        toast.error("获取数据失败，请刷新页面重试");
        console.error(error);
      }
    }
    
    loadDropdownData();
  }, []);

  const form = useForm<z.infer<typeof subOrderSchema>>({
    resolver: zodResolver(subOrderSchema),
    defaultValues: {
      specification: "",
      grade: "",
      interfaceType: "",
      lining: "",
      length: "",
      anticorrosion: "",
      plannedQuantity: 0,
      productionLineId: "",
      warehouseId: "",
      deliveryDate: new Date(),
      priorityLevel: "NORMAL",
      unitWeight: 0,
      notes: "",
    },
  });

  // 根据规格自动设置单重
  const watchSpecification = form.watch("specification");
  
  useEffect(() => {
    if (watchSpecification) {
      const spec = dropdownData.specifications.find(s => s.value === watchSpecification);
      if (spec) {
        // 假设规格对象中有unitWeight属性
        // 实际项目中需要根据具体数据结构调整
        form.setValue("unitWeight", parseFloat(spec.value.split('-')[1] || "0"));
      }
    }
  }, [watchSpecification, dropdownData.specifications, form]);

  // 计算总重量
  useEffect(() => {
    const quantity = form.watch("plannedQuantity");
    const unitWeight = form.watch("unitWeight");
    
    if (quantity && unitWeight) {
      const totalWeight = quantity * unitWeight;
      // 如果有totalWeight字段的话，可以设置
      // form.setValue("totalWeight", totalWeight);
    }
  }, [form.watch("plannedQuantity"), form.watch("unitWeight"), form]);

  const onSubmit = async (values: z.infer<typeof subOrderSchema>) => {
    try {
      setIsLoading(true);
      console.log("准备提交子订单表单数据:", JSON.stringify(values, null, 2));
      
      // 创建子订单
      console.log("开始调用createSubOrder函数，订单ID:", orderId);
      const result = await createSubOrder(orderId, values);
      console.log("子订单创建结果:", result);
      
      if (result.success) {
        toast.success("子订单创建成功");
        form.reset();
        // 跳转到订单详情页面而不是刷新当前页面，确保看到最新数据
        router.push(`/dashboard/orders/${orderId}`);
      } else {
        toast.error(result.error || "子订单创建失败");
        console.error("子订单创建失败:", result.error);
      }
    } catch (error) {
      console.error("子订单创建过程中发生错误:", error);
      // 添加详细错误信息记录
      if (error instanceof Error) {
        console.error("错误详情:", error.message);
        console.error("错误堆栈:", error.stack);
        toast.error(`操作失败: ${error.message}`);
      } else {
        console.error("未知错误类型:", typeof error);
        toast.error("操作失败，请稍后重试");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>添加子订单</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <FormField
                  control={form.control}
                  name="specification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>规格</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {field.value ? field.value : "选择规格..."}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" align="start" side="bottom">
                          <Command>
                            <CommandInput placeholder="搜索规格..." />
                            <CommandList>
                              <CommandEmpty>未找到规格</CommandEmpty>
                              <CommandGroup>
                                {dropdownData.specifications.map((spec) => (
                                  <CommandItem
                                    key={spec.id}
                                    value={spec.value}
                                    onSelect={() => field.onChange(spec.value)}
                                  >
                                    {spec.value}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>级别</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {field.value ? field.value : "选择级别..."}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" align="start" side="bottom">
                          <Command>
                            <CommandInput placeholder="搜索级别..." />
                            <CommandList>
                              <CommandEmpty>未找到级别</CommandEmpty>
                              <CommandGroup>
                                {dropdownData.grades.map((grade) => (
                                  <CommandItem
                                    key={grade.id}
                                    value={grade.value}
                                    onSelect={() => field.onChange(grade.value)}
                                  >
                                    {grade.value}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="interfaceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>接口形式</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {field.value ? field.value : "选择接口形式..."}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" align="start" side="bottom">
                          <Command>
                            <CommandInput placeholder="搜索接口形式..." />
                            <CommandList>
                              <CommandEmpty>未找到接口形式</CommandEmpty>
                              <CommandGroup>
                                {dropdownData.interfaceTypes.map((type) => (
                                  <CommandItem
                                    key={type.id}
                                    value={type.value}
                                    onSelect={() => field.onChange(type.value)}
                                  >
                                    {type.value}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lining"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>内衬</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {field.value ? field.value : "选择内衬..."}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" align="start" side="bottom">
                          <Command>
                            <CommandInput placeholder="搜索内衬..." />
                            <CommandList>
                              <CommandEmpty>未找到内衬</CommandEmpty>
                              <CommandGroup>
                                {dropdownData.linings.map((lining) => (
                                  <CommandItem
                                    key={lining.id}
                                    value={lining.value}
                                    onSelect={() => field.onChange(lining.value)}
                                  >
                                    {lining.value}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="length"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>长度</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {field.value ? field.value : "选择长度..."}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" align="start" side="bottom">
                          <Command>
                            <CommandInput placeholder="搜索长度..." />
                            <CommandList>
                              <CommandEmpty>未找到长度</CommandEmpty>
                              <CommandGroup>
                                {dropdownData.lengths.map((length) => (
                                  <CommandItem
                                    key={length.id}
                                    value={length.value}
                                    onSelect={() => field.onChange(length.value)}
                                  >
                                    {length.value}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="anticorrosion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>防腐</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {field.value ? field.value : "选择防腐措施..."}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" align="start" side="bottom">
                          <Command>
                            <CommandInput placeholder="搜索防腐措施..." />
                            <CommandList>
                              <CommandEmpty>未找到防腐措施</CommandEmpty>
                              <CommandGroup>
                                {dropdownData.anticorrosions.map((anti) => (
                                  <CommandItem
                                    key={anti.id}
                                    value={anti.value}
                                    onSelect={() => field.onChange(anti.value)}
                                  >
                                    {anti.value}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="plannedQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>计划支数</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          disabled={isLoading}
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="unitWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>单重(吨)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          disabled={isLoading}
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>交货日期</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              formatDate(field.value)
                            ) : (
                              <span>选择日期</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date()
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
                  name="priorityLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>优先级</FormLabel>
                      <Select
                        disabled={isLoading}
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择优先级" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {priorityOptions.map((option) => (
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
              
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="productionLineId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>生产线</FormLabel>
                      <Select
                        disabled={isLoading}
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择生产线" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">待定</SelectItem>
                          {dropdownData.productionLines.map((line) => (
                            <SelectItem key={line.id} value={line.id}>
                              {line.value}
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
                  name="warehouseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>仓库</FormLabel>
                      <Select
                        disabled={isLoading}
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择仓库" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">待定</SelectItem>
                          {dropdownData.warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        disabled={isLoading}
                        placeholder="输入子订单备注信息"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <div className="flex items-center justify-end space-x-2">
            <Button
              disabled={isLoading}
              variant="outline"
              type="button"
              onClick={() => form.reset()}
            >
              重置
            </Button>
            <Button disabled={isLoading} type="submit">
              添加子订单
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 