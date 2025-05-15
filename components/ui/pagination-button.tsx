"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { ButtonProps, buttonVariants } from "@/components/ui/button";

interface PaginationButtonProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams?: { [key: string]: string | undefined };
  className?: string;
}

export function PaginationButton({
  currentPage,
  totalPages,
  baseUrl,
  searchParams = {},
  className,
}: PaginationButtonProps) {
  // 生成查询参数字符串
  const getQueryString = (page: number) => {
    const params = new URLSearchParams();
    
    // 添加当前所有查询参数
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== "page") {
        params.append(key, value);
      }
    });
    
    // 添加页码
    params.append("page", page.toString());
    
    return params.toString();
  };

  // 计算要显示的页码
  const getSiblingPages = (): number[] => {
    const siblings: number[] = [];
    const maxSiblings = 1; // 当前页左右各显示一个页码
    
    // 添加前面的页码
    for (let i = Math.max(1, currentPage - maxSiblings); i < currentPage; i++) {
      siblings.push(i);
    }
    
    // 添加当前页
    siblings.push(currentPage);
    
    // 添加后面的页码
    for (let i = currentPage + 1; i <= Math.min(totalPages, currentPage + maxSiblings); i++) {
      siblings.push(i);
    }
    
    return siblings;
  };

  // 当总页数小于等于1时不显示分页
  if (totalPages <= 1) {
    return null;
  }

  const siblings = getSiblingPages();
  const showStartEllipsis = siblings[0] > 1;
  const showEndEllipsis = siblings[siblings.length - 1] < totalPages;

  return (
    <nav
      className={cn("flex items-center space-x-1", className)}
      aria-label="分页"
    >
      {/* 上一页按钮 */}
      {currentPage > 1 ? (
        <Link
          href={`${baseUrl}?${getQueryString(currentPage - 1)}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "icon" }),
            "h-8 w-8"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">上一页</span>
        </Link>
      ) : (
        <div
          className={cn(
            buttonVariants({ variant: "outline", size: "icon" }),
            "h-8 w-8 opacity-50 cursor-not-allowed"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">上一页</span>
        </div>
      )}

      {/* 第一页 */}
      {showStartEllipsis && (
        <>
          <Link
            href={`${baseUrl}?${getQueryString(1)}`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-8 min-w-8"
            )}
          >
            1
          </Link>
          {siblings[0] > 2 && (
            <div className="flex items-center justify-center h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </div>
          )}
        </>
      )}

      {/* 页码按钮 */}
      {siblings.map((page) => (
        <Link
          key={page}
          href={`${baseUrl}?${getQueryString(page)}`}
          className={cn(
            buttonVariants({
              variant: page === currentPage ? "default" : "outline"
            }),
            "h-8 min-w-8",
            page === currentPage && "pointer-events-none"
          )}
        >
          {page}
        </Link>
      ))}

      {/* 最后一页 */}
      {showEndEllipsis && (
        <>
          {siblings[siblings.length - 1] < totalPages - 1 && (
            <div className="flex items-center justify-center h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </div>
          )}
          <Link
            href={`${baseUrl}?${getQueryString(totalPages)}`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-8 min-w-8"
            )}
          >
            {totalPages}
          </Link>
        </>
      )}

      {/* 下一页按钮 */}
      {currentPage < totalPages ? (
        <Link
          href={`${baseUrl}?${getQueryString(currentPage + 1)}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "icon" }),
            "h-8 w-8"
          )}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">下一页</span>
        </Link>
      ) : (
        <div
          className={cn(
            buttonVariants({ variant: "outline", size: "icon" }),
            "h-8 w-8 opacity-50 cursor-not-allowed"
          )}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">下一页</span>
        </div>
      )}
    </nav>
  );
} 