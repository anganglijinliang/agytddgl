"use client";

import { useEffect, useState } from "react";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { ProductionTable } from "./components/production-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { getProductions } from "./actions";
import { ProductionWithDetails } from "@/types/extended-types";
import { toast } from "sonner";

const ProductionPage = () => {
  const router = useRouter();
  const [productions, setProductions] = useState<ProductionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProductions = async () => {
    try {
      setLoading(true);
      const data = await getProductions();
      setProductions(data);
    } catch (error) {
      toast.error("加载生产数据失败");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductions();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading title="生产管理" description="管理生产计划和进度" />
        <Button onClick={() => router.push("/dashboard/production/new")}>
          <Plus className="mr-2 h-4 w-4" />
          添加生产记录
        </Button>
      </div>
      <Separator />
      <ProductionTable 
        data={productions} 
        loading={loading} 
        onRefresh={loadProductions} 
      />
    </div>
  );
};

export default ProductionPage; 