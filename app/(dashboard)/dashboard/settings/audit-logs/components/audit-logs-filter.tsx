"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRangeClient } from "@/components/ui/date-range-picker-client";
import { Filter, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

// 资源类型选项
const resourceOptions = [
  { value: "USER", label: "用户" },
  { value: "ORDER", label: "订单" },
  { value: "SUB_ORDER", label: "子订单" },
  { value: "CUSTOMER", label: "客户" },
  { value: "PRODUCTION", label: "生产" },
  { value: "SHIPPING", label: "发运" },
  { value: "MASTER_DATA", label: "基础数据" },
  { value: "SETTING", label: "系统设置" },
  { value: "SYSTEM", label: "系统" }
];

// 操作类型选项
const actionOptions = [
  { value: "CREATE", label: "创建" },
  { value: "UPDATE", label: "更新" },
  { value: "DELETE", label: "删除" },
  { value: "LOGIN", label: "登录" },
  { value: "LOGOUT", label: "登出" },
  { value: "EXPORT", label: "导出" },
  { value: "IMPORT", label: "导入" },
  { value: "VIEW", label: "查看" },
  { value: "CHANGE_STATUS", label: "变更状态" },
  { value: "SYSTEM", label: "系统操作" }
];

interface AuditLogsFilterProps {
  searchParams: { [key: string]: string | undefined };
}

export function AuditLogsFilter({ searchParams }: AuditLogsFilterProps) {
  const router = useRouter();
  const [search, setSearch] = useState(searchParams.search || "");
  const [resource, setResource] = useState(searchParams.resource || "");
  const [action, setAction] = useState(searchParams.action || "");

  // 处理筛选按钮
  const handleFilter = () => {
    // 构建新的URL参数
    const params = new URLSearchParams();
    
    if (resource) params.set("resource", resource);
    if (action) params.set("action", action);
    if (search) params.set("search", search);
    
    // 重置为第一页
    params.set("page", "1");
    
    // 导航到新URL
    router.push(`/dashboard/settings/audit-logs?${params.toString()}`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>筛选条件</CardTitle>
        <CardDescription>
          使用多个条件组合筛选审计日志记录
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">资源类型</label>
            <Select 
              value={resource} 
              onValueChange={setResource}
            >
              <SelectTrigger>
                <SelectValue placeholder="所有资源" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="">所有资源</SelectItem>
                  {resourceOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">操作类型</label>
            <Select 
              value={action} 
              onValueChange={setAction}
            >
              <SelectTrigger>
                <SelectValue placeholder="所有操作" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="">所有操作</SelectItem>
                  {actionOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">日期范围</label>
            <DatePickerWithRangeClient />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">搜索</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="搜索描述..." 
                  className="pl-9" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleFilter();
                  }}
                />
              </div>
              <Button onClick={handleFilter}>
                <Filter className="mr-2 h-4 w-4" />
                筛选
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 