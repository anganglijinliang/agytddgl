"use client";

import * as React from "react";
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

interface BarChartProps {
  data: any[];
  categories: string[];
  index: string;
  colors?: string[];
  yAxisWidth?: number;
  showLegend?: boolean;
}

export function BarChart({
  data,
  categories,
  index,
  colors = ["#0066FF", "#009900", "#FF6600", "#9933CC"],
  yAxisWidth = 50,
  showLegend = false,
}: BarChartProps) {
  // 如果数据为空，显示空白
  if (data.length === 0) {
    return (
      <div className="flex h-[240px] w-full items-center justify-center">
        <p className="text-sm text-muted-foreground">暂无数据</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey={index}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          width={yAxisWidth}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip 
          cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
          contentStyle={{ 
            backgroundColor: "white", 
            borderRadius: "8px", 
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            border: "none",
            padding: "8px"
          }}
          wrapperStyle={{ zIndex: 100 }}
          formatter={(value: number) => [`${value}`, ""]}
        />
        {showLegend && <Legend />}
        {categories.map((category, index) => (
          <Bar
            key={category}
            dataKey={category}
            fill={colors[index % colors.length]}
            radius={[4, 4, 0, 0]}
            barSize={30}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
} 