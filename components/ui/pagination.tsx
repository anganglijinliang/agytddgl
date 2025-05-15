import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ totalPages, currentPage, onPageChange }: PaginationProps) {
  // 计算要显示的页码范围
  const getPageRange = () => {
    const maxPagesToShow = 5;
    const range: number[] = [];

    if (totalPages <= maxPagesToShow) {
      // 如果总页数小于或等于显示的最大页数，则显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      // 始终包含第一页和最后一页
      // 显示当前页周围的页面
      const leftSiblingCount = Math.floor((maxPagesToShow - 3) / 2);
      const rightSiblingCount = Math.ceil((maxPagesToShow - 3) / 2);

      // 是否显示左边的省略号
      const showLeftDots = currentPage - leftSiblingCount > 2;
      // 是否显示右边的省略号
      const showRightDots = currentPage + rightSiblingCount < totalPages - 1;

      if (!showLeftDots && showRightDots) {
        // 左边没有省略号，右边有省略号
        for (let i = 1; i <= maxPagesToShow - 1; i++) {
          range.push(i);
        }
        range.push(totalPages);
      } else if (showLeftDots && !showRightDots) {
        // 左边有省略号，右边没有省略号
        range.push(1);
        for (let i = totalPages - (maxPagesToShow - 2); i <= totalPages; i++) {
          range.push(i);
        }
      } else if (showLeftDots && showRightDots) {
        // 两边都有省略号
        range.push(1);
        for (let i = currentPage - leftSiblingCount; i <= currentPage + rightSiblingCount; i++) {
          range.push(i);
        }
        range.push(totalPages);
      }
    }

    return range;
  };

  const pageRange = getPageRange();

  return (
    <div className="flex items-center justify-center space-x-2 mt-4">
      <Button
        size="icon"
        variant="outline"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {pageRange.map((page, index) => {
        // 如果需要添加省略号
        if (index > 0 && page - pageRange[index - 1] > 1) {
          return (
            <span key={`ellipsis-${page}`} className="px-3 py-1.5 text-sm">
              ...
            </span>
          );
        }

        return (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className="min-w-8"
          >
            {page}
          </Button>
        );
      })}
      
      <Button
        size="icon"
        variant="outline"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
} 