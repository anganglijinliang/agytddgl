"use client";

import { useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { ProductionWithDetails } from "@/types/extended-types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Eye, MoreHorizontal, RefreshCcw, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteProduction } from "../actions";
import { toast } from "sonner";

interface ProductionTableProps {
  data: ProductionWithDetails[];
  loading: boolean;
  onRefresh: () => void;
}

export const ProductionTable: React.FC<ProductionTableProps> = ({
  data,
  loading,
  onRefresh,
}) => {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const columns: ColumnDef<ProductionWithDetails>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="w-[80px]">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "subOrder.order.orderNumber",
      header: "订单号",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.subOrder.order.orderNumber}
        </div>
      ),
    },
    {
      accessorKey: "subOrder.order.customer.name",
      header: "客户",
      cell: ({ row }) => (
        <div>{row.original.subOrder.order.customer.name}</div>
      ),
    },
    {
      accessorKey: "subOrder.specification",
      header: "规格",
      cell: ({ row }) => <div>{row.original.subOrder.specification}</div>,
    },
    {
      accessorKey: "team",
      header: "生产班组",
      cell: ({ row }) => (
        <div>{row.original.team}</div>
      ),
    },
    {
      accessorKey: "shift",
      header: "班次",
      cell: ({ row }) => {
        const shift = row.original.shift;
        const shiftMap = {
          NIGHT_SHIFT: "夜班",
          DAY_SHIFT: "白班",
          MIDDLE_SHIFT: "中班",
        };
        return <div>{shiftMap[shift as keyof typeof shiftMap] || shift}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "状态",
      cell: ({ row }) => {
        const status = row.original.status;
        const statusVariantMap: Record<string, { text: string; variant: "destructive" | "outline" | "secondary" | "default" }> = {
          NOT_STARTED: { text: "未开始", variant: "outline" },
          IN_PROGRESS: { text: "进行中", variant: "default" },
          COMPLETED: { text: "已完成", variant: "secondary" },
          PAUSED: { text: "已暂停", variant: "destructive" },
        };
        const statusInfo = statusVariantMap[status] || { text: status, variant: "outline" };
        return <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>;
      },
    },
    {
      accessorKey: "quantity",
      header: "生产数量",
      cell: ({ row }) => <div>{row.original.quantity}</div>,
    },
    {
      accessorKey: "startTime",
      header: "开始时间",
      cell: ({ row }) => <div>{row.original.startTime ? format(new Date(row.original.startTime), 'yyyy-MM-dd HH:mm') : '未开始'}</div>,
    },
    {
      accessorKey: "endTime",
      header: "结束时间",
      cell: ({ row }) => <div>{row.original.endTime ? format(new Date(row.original.endTime), 'yyyy-MM-dd HH:mm') : '未完成'}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const production = row.original;
        
        const onDelete = async () => {
          try {
            await deleteProduction(production.id);
            toast.success("生产记录删除成功");
            onRefresh();
          } catch (error) {
            toast.error("删除失败");
            console.error(error);
          }
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">打开菜单</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Button
                className="w-full justify-start px-2 text-left font-normal"
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/dashboard/production/${production.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                查看详情
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="w-full justify-start px-2 text-left font-normal text-destructive"
                    variant="ghost"
                    size="sm"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    删除
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认删除</AlertDialogTitle>
                    <AlertDialogDescription>
                      您确定要删除这条生产记录吗？此操作无法撤销。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete}>删除</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-8 w-[90px]" />
          <Skeleton className="ml-auto h-8 w-[70px]" />
        </div>
        <div className="rounded-md border">
          <div className="h-12 border-b" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 border-b last:border-0">
              <Skeleton className="h-full w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Input
          placeholder="按订单号过滤..."
          value={(table.getColumn("subOrder.order.orderNumber")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("subOrder.order.orderNumber")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            刷新
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                显示列
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  没有找到记录
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <div className="text-sm text-muted-foreground">
          共 {table.getFilteredRowModel().rows.length} 条记录
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          上一页
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          下一页
        </Button>
      </div>
    </div>
  );
}; 