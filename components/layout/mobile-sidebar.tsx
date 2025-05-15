"use client";

import React, { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { UserButton } from "@/components/user/user-button";
import { dashboardConfig } from "@/lib/config";
import { BarChart3, ClipboardList, Layers, Package, TruckIcon, Settings, Users, Activity } from "lucide-react";
import { canAccess } from "@/lib/rbac";
import { useCurrentUser } from "@/hooks/use-current-user";

// 图标映射
const iconMap = {
  dashboard: <BarChart3 size={20} />,
  orders: <ClipboardList size={20} />,
  production: <Layers size={20} />,
  inventory: <Package size={20} />,
  shipping: <TruckIcon size={20} />,
  settings: <Settings size={20} />,
  users: <Users size={20} />,
  analytics: <Activity size={20} />,
};

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const user = useCurrentUser();

  // 关闭侧边栏
  const handleClose = () => {
    setOpen(false);
  };

  // 判断当前路径是否激活
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="打开菜单"
        >
          <Menu size={24} />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="Logo" className="w-8 h-8" />
              <span className="text-xl font-bold">安钢永通</span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-auto py-2">
            <div className="space-y-1 px-2">
              {dashboardConfig.mainNav.map((item) => {
                // 检查用户是否有权限访问此页面
                const hasAccess = !item.resource || 
                  (user && canAccess(user.role, item.resource, "read"));
                
                if (!hasAccess) return null;

                // 如果有子菜单，使用手风琴组件
                if (item.items && item.items.length > 0) {
                  return (
                    <Accordion
                      key={item.title}
                      type="single"
                      collapsible
                      className="border rounded-md overflow-hidden mb-2"
                    >
                      <AccordionItem value={item.title} className="border-none">
                        <AccordionTrigger className="px-3 py-2 hover:bg-gray-100">
                          <div className="flex items-center text-gray-700">
                            <span className="mr-2">{iconMap[item.icon as keyof typeof iconMap]}</span>
                            <span>{item.title}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-2">
                          <div className="pl-9 space-y-1">
                            {item.items.map((subItem) => {
                              const subItemHasAccess = !subItem.resource || 
                                (user && canAccess(user.role, subItem.resource, "read"));
                              
                              if (!subItemHasAccess) return null;

                              return (
                                <Link
                                  key={subItem.href}
                                  href={subItem.href}
                                  onClick={handleClose}
                                  className={cn(
                                    "block px-3 py-2 text-sm rounded-md",
                                    isActive(subItem.href)
                                      ? "bg-gray-200 text-gray-900 font-medium"
                                      : "text-gray-600 hover:bg-gray-100"
                                  )}
                                >
                                  {subItem.title}
                                </Link>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  );
                }

                // 单个菜单项
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleClose}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm rounded-md",
                      isActive(item.href)
                        ? "bg-gray-200 text-gray-900 font-medium"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <span className="mr-3">{iconMap[item.icon as keyof typeof iconMap]}</span>
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* 用户信息和退出按钮 */}
          <div className="mt-auto p-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <UserButton />
                <div className="ml-3">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 