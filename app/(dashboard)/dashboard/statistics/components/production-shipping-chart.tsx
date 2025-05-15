"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ProductionData {
  month: number;
  year: number;
  total: number;
}

interface ShippingData {
  month: number;
  year: number;
  total: number;
}

interface ProductionShippingChartProps {
  productionData: any[];
  shippingData: any[];
}

export function ProductionShippingChart({ productionData, shippingData }: ProductionShippingChartProps) {
  // 合并数据并格式化为图表需要的格式
  const chartData = productionData.map((prod: any) => {
    // 查找相同年月的发货数据
    const matchingShipping = shippingData.find(
      (ship: any) => Number(ship.month) === Number(prod.month) && Number(ship.year) === Number(prod.year)
    );

    // 月份名称
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                        '七月', '八月', '九月', '十月', '十一月', '十二月'];
    
    return {
      name: `${monthNames[Number(prod.month) - 1]}`,
      生产: Number(prod.total),
      发货: matchingShipping ? Number(matchingShipping.total) : 0,
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip formatter={(value) => [`${value} 件`, '']} />
        <Legend />
        <Bar dataKey="生产" fill="#3b82f6" /> 
        <Bar dataKey="发货" fill="#f97316" />
      </BarChart>
    </ResponsiveContainer>
  );
} 