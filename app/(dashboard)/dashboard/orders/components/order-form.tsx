"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { orderBaseSchema } from "@/lib/request-schema";
import { Order, OrderStatus, ShippingMethod } from "@prisma/client";
import { createOrder, updateOrder } from "../actions";
import { SubOrderForm } from "./sub-order-form";
import { createAuditLog } from "@/lib/create-audit-log";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Customer = {
  id: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

interface OrderFormProps {
  initialData: Order | null;
  customers: Customer[];
}

const formSchema = orderBaseSchema;

type FormValues = z.infer<typeof formSchema>;

export function OrderForm({ initialData, customers }: OrderFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [error, setError] = useState<string | null>(null);
  const [originalStatus, setOriginalStatus] = useState<OrderStatus | null>(null);

  // 创建符合类型要求的defaultValues
  const defaultValues: FormValues = {
    customerId: initialData?.customerId || "",
    shippingMethod: initialData?.shippingMethod || "SELF_DELIVERY",
    shippingAddress: initialData?.shippingAddress || undefined,
    paymentTerms: initialData?.paymentTerms || undefined,
    notes: initialData?.notes || undefined,
    status: initialData?.status || "DRAFT",
    totalAmount: initialData?.totalAmount || undefined,
    paymentStatus: initialData?.paymentStatus || undefined,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  useEffect(() => {
    if (initialData?.status) {
      setOriginalStatus(initialData.status);
    }
  }, [initialData]);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (initialData) {
        // 更新订单
        const result = await updateOrder(initialData.id, values);
        if (result.success) {
          toast.success("订单更新成功");
          
          if (originalStatus !== values.status) {
            await createAuditLog({
              action: "update_status",
              resource: "order",
              resourceId: initialData.id,
              description: `订单状态从 ${getStatusLabel(originalStatus)} 变更为 ${getStatusLabel(values.status)}`,
            });
          }
          
          router.push("/dashboard/orders");
          router.refresh();
        } else {
          toast.error(result.error || "订单更新失败");
        }
      } else {
        // 创建订单
        const result = await createOrder(values);
        if (result.success) {
          toast.success("订单创建成功");
          router.push(`/dashboard/orders/${result.id}`);
          router.refresh();
        } else {
          toast.error(result.error || "订单创建失败");
        }
      }
    } catch (error: any) {
      setError(error.message || "操作失败，请稍后重试");
      toast.error("操作失败，请稍后重试");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取状态显示标签
  function getStatusLabel(status: OrderStatus | null): string {
    if (!status) return "";
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  }

  // 当发运方式变更时的逻辑
  const handleShippingMethodChange = (value: string) => {
    const method = value as ShippingMethod;
    form.setValue("shippingMethod", method);
    
    // 如果是客户自提，清空发运地址
    if (method === ShippingMethod.CUSTOMER_PICKUP) {
      form.setValue("shippingAddress", "");
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          {initialData && (
            <TabsTrigger value="suborders">子订单信息</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4 pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>错误</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>订单基本信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>客户</FormLabel>
                        <Select
                          disabled={isLoading}
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择客户" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>选择订单所属客户</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>订单状态</FormLabel>
                        <Select
                          disabled={isLoading}
                          onValueChange={field.onChange}
                          value={field.value}
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
                        <FormDescription>订单当前处理状态</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="shippingMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>发运方式</FormLabel>
                        <Select
                          disabled={isLoading}
                          onValueChange={handleShippingMethodChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择发运方式" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {shippingMethodOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          选择订单的发运方式
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="shippingAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>发运地址</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="输入发运地址..."
                            className="resize-none"
                            {...field}
                            disabled={isLoading || form.getValues("shippingMethod") === ShippingMethod.CUSTOMER_PICKUP}
                          />
                        </FormControl>
                        <FormDescription>
                          {form.getValues("shippingMethod") === ShippingMethod.CUSTOMER_PICKUP 
                            ? "客户自提无需填写发运地址" 
                            : "自发运需要填写发运地址"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>付款条款</FormLabel>
                        <FormControl>
                          <Input placeholder="输入付款条款..." {...field} />
                        </FormControl>
                        <FormDescription>例如: 30天付款期</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="totalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>总金额</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="输入总金额..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>订单总金额（元）</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="paymentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>付款状态</FormLabel>
                        <FormControl>
                          <Input placeholder="输入付款状态..." {...field} />
                        </FormControl>
                        <FormDescription>例如: 已付款、部分付款、未付款</FormDescription>
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
                            placeholder="输入备注信息..."
                            className="resize-none"
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
                  onClick={() => router.push("/dashboard/orders")}
                >
                  取消
                </Button>
                <Button disabled={isLoading} type="submit">
                  {isLoading ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    initialData ? "更新订单" : "创建订单"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>
        
        {initialData && (
          <TabsContent value="suborders" className="space-y-4 pt-4">
            <SubOrderForm orderId={initialData.id} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
} 