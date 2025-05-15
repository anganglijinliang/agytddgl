"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Play } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function DatabaseMigrationForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [migrationOutput, setMigrationOutput] = useState("");
  const { toast } = useToast();

  const runMigration = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setMigrationOutput("正在执行数据库迁移...");
      
      // 获取存储在环境变量或本地存储中的API密钥
      const apiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY || localStorage.getItem("admin_api_key") || "";
      
      const response = await fetch("/api/admin/migrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "迁移失败");
      }
      
      // 显示迁移结果
      setMigrationOutput(`迁移成功!\n\n${JSON.stringify(result.details, null, 2)}`);
      
      toast({
        title: "数据库迁移成功",
        description: "数据库架构已更新到最新版本",
        variant: "default",
      });
    } catch (error) {
      console.error("迁移错误:", error);
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      setMigrationOutput(`迁移失败: ${errorMessage}`);
      
      toast({
        title: "数据库迁移失败",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button
          onClick={runMigration}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              执行中...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              执行迁移
            </>
          )}
        </Button>
      </div>
      
      {migrationOutput && (
        <Card className="p-4 mt-4">
          <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-40">
            {migrationOutput}
          </pre>
        </Card>
      )}
      
      <div className="text-xs text-muted-foreground mt-4">
        <p>执行迁移将更新数据库架构以匹配当前的Prisma模型。</p>
        <p className="mt-1">此操作是安全的，不会删除数据，但建议在操作前备份数据库。</p>
      </div>
    </div>
  );
} 