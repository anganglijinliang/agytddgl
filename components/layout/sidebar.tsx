"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  BarChart3,
  Calendar,
  ClipboardList,
  Database,
  Factory,
  Home,
  Layers,
  LayoutDashboard,
  Package,
  Settings,
  Truck,
  Users,
} from "lucide-react";
import { UserRole } from "@/types";
import { useSession } from "next-auth/react";

interface SidebarProps {
  className?: string;
}

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  variant: "default" | "ghost";
  roles?: UserRole[];
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole | undefined;

  const sidebarItems: SidebarItem[] = [
    {
      title: "概览",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      variant: pathname === "/dashboard" ? "default" : "ghost",
    },
    {
      title: "数据统计",
      href: "/dashboard/statistics",
      icon: <BarChart3 className="h-5 w-5" />,
      variant: pathname === "/dashboard/statistics" ? "default" : "ghost",
    },
    {
      title: "订单管理",
      href: "/dashboard/orders",
      icon: <ClipboardList className="h-5 w-5" />,
      variant: pathname.includes("/dashboard/orders") ? "default" : "ghost",
    },
    {
      title: "生产管理",
      href: "/dashboard/production",
      icon: <Factory className="h-5 w-5" />,
      variant: pathname.includes("/dashboard/production") ? "default" : "ghost",
    },
    {
      title: "生产计划",
      href: "/dashboard/production/planning",
      icon: <Calendar className="h-5 w-5" />,
      variant: pathname.includes("/dashboard/production/planning") ? "default" : "ghost",
    },
    {
      title: "发货管理",
      href: "/dashboard/shipping",
      icon: <Truck className="h-5 w-5" />,
      variant: pathname.includes("/dashboard/shipping") ? "default" : "ghost",
    },
    {
      title: "库存管理",
      href: "/dashboard/inventory",
      icon: <Package className="h-5 w-5" />,
      variant: pathname.includes("/dashboard/inventory") ? "default" : "ghost",
    },
    {
      title: "基础数据",
      href: "/dashboard/data",
      icon: <Layers className="h-5 w-5" />,
      variant: pathname.includes("/dashboard/data") ? "default" : "ghost",
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    },
    {
      title: "用户管理",
      href: "/dashboard/users",
      icon: <Users className="h-5 w-5" />,
      variant: pathname.includes("/dashboard/users") ? "default" : "ghost",
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    },
    {
      title: "系统设置",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
      variant: pathname.includes("/dashboard/settings") ? "default" : "ghost",
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    },
    {
      title: "数据库管理",
      href: "/dashboard/settings/database",
      icon: <Database className="h-5 w-5" />,
      variant: pathname.includes("/dashboard/settings/database") ? "default" : "ghost",
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
    },
  ];

  // 移除用户角色无权访问的菜单项
  const filteredItems = userRole 
    ? sidebarItems.filter(item => !item.roles || item.roles.includes(userRole))
    : sidebarItems;

  return (
    <div className={cn("pb-4 h-full", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="flex h-12 items-center justify-start mb-4 px-2">
            <h2 className="text-xl font-bold">订单管理系统</h2>
          </div>
          <div className="space-y-1">
            {filteredItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: item.variant, size: "sm" }),
                  "w-full justify-start flex items-center gap-x-2 mb-1"
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 