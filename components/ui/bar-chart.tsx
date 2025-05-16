"use client";

import * as React from "react";
import { useState, useEffect } from "react";

interface BarChartProps {
  data: any[];
  categories: string[];
  index: string;
  colors?: string[];
  yAxisWidth?: number;
  showLegend?: boolean;
}

export function BarChart(props: BarChartProps) {
  const {
    data,
    categories,
    index,
    colors = ["blue", "green"],
  } = props;
  
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 计算最大值来进行缩放
  const maxValue = React.useMemo(() => {
    if (!data || data.length === 0) return 0;
    return Math.max(
      ...data.flatMap(item => categories.map(cat => item[cat] || 0))
    );
  }, [data, categories]);

  // 加载中状态
  if (!isMounted) {
    return (
      <div className="flex h-[240px] w-full items-center justify-center">
        <p className="text-sm text-muted-foreground">图表加载中...</p>
      </div>
    );
  }

  // 数据为空状态
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[240px] w-full items-center justify-center">
        <p className="text-sm text-muted-foreground">暂无数据</p>
      </div>
    );
  }

  // 创建简单的HTML图表
  return (
    <div className="h-[300px] w-full">
      {/* 图例 */}
      <div className="flex items-center justify-end mb-4 gap-4">
        {categories.map((category, i) => (
          <div key={category} className="flex items-center">
            <div 
              className={`w-3 h-3 rounded-full mr-2`}
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            <span className="text-sm">{category}</span>
          </div>
        ))}
      </div>
      
      {/* 图表主体 */}
      <div className="relative h-[250px]">
        {/* Y轴标签 */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
          {maxValue > 0 && [1, 0.75, 0.5, 0.25, 0].map(fraction => (
            <div key={fraction}>{Math.round(maxValue * fraction)}</div>
          ))}
        </div>
        
        {/* 图表内容 */}
        <div className="absolute left-8 right-0 top-0 h-full">
          <div className="h-full w-full border-l border-gray-200 flex">
            {data.map((item, dataIndex) => (
              <div key={dataIndex} className="flex-1 flex flex-col justify-end items-center border-b border-gray-200">
                <div className="relative w-8 mb-1">
                  {categories.map((category, catIndex) => (
                    <div 
                      key={category}
                      className={`absolute bottom-0 w-3 rounded-t-sm`}
                      style={{ 
                        height: `${((item[category] || 0) / maxValue) * 200}px`,
                        left: catIndex * 4,
                        backgroundColor: colors[catIndex % colors.length] 
                      }}
                    />
                  ))}
                </div>
                <div className="text-xs mt-2">{item[index]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 