"use client";

import { useSearchParams } from "next/navigation";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { ShippingForm } from "../components/shipping-form";
import { Suspense, useEffect, useState } from "react";

// 创建一个内部组件包含useSearchParams的逻辑
const ShippingPageContent = () => {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [warehouses, setWarehouses] = useState([]);
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取下拉数据
    const fetchDropdownData = async () => {
      try {
        setLoading(true);
        // 获取仓库数据
        const warehousesRes = await fetch('/api/warehouses');
        const warehousesData = await warehousesRes.json();
        
        // 获取子订单数据
        const dropdownRes = await fetch('/api/shipping/dropdown');
        const dropdownData = await dropdownRes.json();
        
        setWarehouses(warehousesData.warehouses || []);
        setSubOrders(dropdownData.subOrders || []);
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDropdownData();
  }, []);

  if (loading) {
    return <div className="flex-1 space-y-4 p-8 pt-6">加载中...</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div>
        <Heading title="新增发货记录" description="创建新的发货记录" />
      </div>
      <Separator />
      <ShippingForm 
        warehouses={warehouses} 
        subOrders={subOrders} 
      />
    </div>
  );
};

// 主页面组件使用Suspense包裹内容
const NewShippingPage = () => {
  return (
    <Suspense fallback={<div className="flex-1 space-y-4 p-8 pt-6">加载中...</div>}>
      <ShippingPageContent />
    </Suspense>
  );
};

export default NewShippingPage; 