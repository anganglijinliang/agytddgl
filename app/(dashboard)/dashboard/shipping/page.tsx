"use client";

import { useEffect, useState } from "react";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { ShippingTable } from "./components/shipping-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { getShippings } from "./actions";
import { ShippingWithDetails } from "@/types/extended-types";
import { toast } from "sonner";

const ShippingPage = () => {
  const router = useRouter();
  const [shippings, setShippings] = useState<ShippingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const loadShippings = async () => {
    try {
      setLoading(true);
      const data = await getShippings();
      setShippings(data);
    } catch (error) {
      toast.error("加载发货数据失败");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShippings();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading title="发货管理" description="管理发货记录和跟踪" />
        <Button onClick={() => router.push("/dashboard/shipping/new")}>
          <Plus className="mr-2 h-4 w-4" />
          添加发货记录
        </Button>
      </div>
      <Separator />
      <ShippingTable 
        data={shippings} 
        loading={loading} 
        onRefresh={loadShippings} 
      />
    </div>
  );
};

export default ShippingPage; 