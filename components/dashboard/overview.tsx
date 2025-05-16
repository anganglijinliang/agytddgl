"use client";

import { BarChart } from "@/components/ui/bar-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

export function Overview() {
  return (
    <div className="h-[300px] w-full">
      <BarChart
        data={data}
        categories={["新订单", "已完成"]}
        index="name"
        colors={["blue", "green"]}
        yAxisWidth={40}
        showLegend={true}
      />
    </div>
  );
} 