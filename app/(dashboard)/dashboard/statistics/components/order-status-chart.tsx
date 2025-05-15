"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getStatusText } from '@/lib/utils';

// 状态对应的颜色
const STATUS_COLORS = {
  DRAFT: "#94a3b8", // slate-400
  CONFIRMED: "#60a5fa", // blue-400
  IN_PRODUCTION: "#facc15", // yellow-400
  PARTIALLY_SHIPPED: "#fb923c", // orange-400
  COMPLETED: "#4ade80", // green-400
  CANCELED: "#f87171", // red-400
};

interface OrderStatusData {
  status: string;
  _count: {
    id: number;
  };
}

interface OrderStatusChartProps {
  data: OrderStatusData[];
}

export function OrderStatusChart({ data }: OrderStatusChartProps) {
  // 转换数据格式为图表需要的格式
  const chartData = data.map((item) => ({
    name: getStatusText(item.status),
    value: item._count.id,
    status: item.status,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || "#94a3b8"} 
            />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => [`${value} 个订单`, "数量"]} 
          labelFormatter={(name) => `状态: ${name}`}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
} 