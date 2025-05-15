import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { withPermission } from "@/lib/rbac";
import { formatDateTime } from "@/lib/utils";
import { AuditLogsFilter } from "./components/audit-logs-filter";
import { PaginationButton } from "@/components/ui/pagination-button";

export const metadata = {
  title: "审计日志 | 安钢集团永通球墨铸铁管订单管理系统",
};

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) {
  // 权限检查 - 只有管理员和超级管理员可以查看
  await withPermission("settings", "view");

  // 处理查询参数
  const page = Number(searchParams.page) || 1;
  const pageSize = 20;
  const resource = searchParams.resource || "";
  const action = searchParams.action || "";
  const search = searchParams.search || "";

  // 获取审计日志列表
  const logs = await db.auditLog.findMany({
    where: {
      ...(resource ? { resource } : {}),
      ...(action ? { action } : {}),
      ...(search ? {
        description: {
          contains: search,
          mode: "insensitive",
        },
      } : {}),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  // 获取总记录数
  const total = await db.auditLog.count({
    where: {
      ...(resource ? { resource } : {}),
      ...(action ? { action } : {}),
      ...(search ? {
        description: {
          contains: search,
          mode: "insensitive",
        },
      } : {}),
    },
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="px-4 py-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <Heading title="审计日志" description="系统操作记录和变更历史" />
      </div>
      <Separator />
     
      {/* 筛选条件 */}
      <AuditLogsFilter searchParams={searchParams} />
      
      {/* 日志列表 */}
      <Card>
        <CardHeader>
          <CardTitle>审计日志记录</CardTitle>
          <CardDescription>
            共 {total} 条记录，显示 {Math.min(logs.length, pageSize)} 条
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>时间</TableHead>
                <TableHead>用户</TableHead>
                <TableHead>操作</TableHead>
                <TableHead>资源</TableHead>
                <TableHead className="w-[300px]">描述</TableHead>
                <TableHead>IP地址</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    没有找到符合条件的审计日志记录
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {formatDateTime(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      {log.user ? (
                        <div className="flex flex-col">
                          <span>{log.user.name || "未知用户"}</span>
                          <span className="text-xs text-muted-foreground">
                            {log.user.email}
                          </span>
                        </div>
                      ) : (
                        "系统"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.resource}
                      {log.resourceId && (
                        <span className="text-xs text-muted-foreground block">
                          ID: {log.resourceId.substring(0, 8)}...
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate">
                      {log.description}
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.ipAddress}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <PaginationButton
                currentPage={page}
                totalPages={totalPages}
                baseUrl="/dashboard/settings/audit-logs"
                searchParams={searchParams}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// 辅助函数：根据操作类型返回徽章样式
function getActionBadgeVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  switch (action) {
    case "CREATE":
      return "default";
    case "UPDATE":
    case "CHANGE_STATUS":
      return "secondary";
    case "DELETE":
      return "destructive";
    default:
      return "outline";
  }
} 