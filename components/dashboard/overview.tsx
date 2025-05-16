"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

// 示例数据 - 实际应用中应从API获取
const data = [
  {
    name: "1月",
    "新订单": 20,
    "已完成": 15,
  },
  {
    name: "2月",
    "新订单": 18,
    "已完成": 16,
  },
  {
    name: "3月",
    "新订单": 25,
    "已完成": 19,
  },
  {
    name: "4月",
    "新订单": 22,
    "已完成": 21,
  },
  {
    name: "5月",
    "新订单": 30,
    "已完成": 24,
  },
  {
    name: "6月",
    "新订单": 27,
    "已完成": 25,
  },
];

// 计算最大值，用于图表比例
const maxValue = Math.max(
  ...data.map(item => Math.max(item["新订单"], item["已完成"]))
);

export function Overview() {
  const [isClient, setIsClient] = useState(false);

  // 客户端渲染检查
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div className="h-[300px] w-full flex items-center justify-center">加载中...</div>;
  }

  return (
    <div className="h-[300px] w-full">
      <div className="flex items-center justify-end mb-4 gap-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-sm">新订单</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm">已完成</span>
        </div>
      </div>
      
      <div className="relative h-[250px]">
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
          <div>30</div>
          <div>20</div>
          <div>10</div>
          <div>0</div>
        </div>
        
        <div className="absolute left-8 right-0 top-0 h-full">
          <div className="h-full w-full border-l border-gray-200 flex">
            {data.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col justify-end items-center border-b border-gray-200">
                <div className="relative w-8 mb-1">
                  <div 
                    className="absolute bottom-0 w-3 bg-blue-500 rounded-t-sm left-0" 
                    style={{ height: `${(item["新订单"] / maxValue) * 200}px` }}
                  ></div>
                  <div 
                    className="absolute bottom-0 w-3 bg-green-500 rounded-t-sm right-0" 
                    style={{ height: `${(item["已完成"] / maxValue) * 200}px` }}
                  ></div>
                </div>
                <div className="text-xs mt-2">{item.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 