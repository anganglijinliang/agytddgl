"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { orderBaseSchema } from "@/lib/request-schema";
import { Order } from "@prisma/client";
import { createOrder, updateOrder } from "../actions";
import { SubOrderForm } from "./sub-order-form";

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

  // 创建符合类型要求的defaultValues
  const defaultValues: FormValues = {
    customerId: initialData?.customerId || "",
    shippingMethod: initialData?.shippingMethod || "SELF_DELIVERY",
    shippingAddress: initialData?.shippingAddress || undefined,
    paymentTerms: initialData?.paymentTerms || undefined,
    notes: initialData?.notes || undefined,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      
      if (initialData) {
        // 更新订单
        const result = await updateOrder(initialData.id, values);
        if (result.success) {
          toast.success("订单更新成功");
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
    } catch (error) {
      toast.error("操作失败，请稍后重试");
      console.error(error);
    } finally {
      setIsLoading(false);
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
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择发运方式" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SELF_DELIVERY">厂家送货</SelectItem>
                            <SelectItem value="CUSTOMER_PICKUP">客户自提</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="shippingAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>送货地址</FormLabel>
                        <FormControl>
                          <Input disabled={isLoading} {...field} />
                        </FormControl>
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
                          <Input disabled={isLoading} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>备注</FormLabel>
                        <FormControl>
                          <Textarea
                            disabled={isLoading}
                            placeholder="输入订单备注信息"
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
                  {initialData ? "更新订单" : "创建订单"}
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