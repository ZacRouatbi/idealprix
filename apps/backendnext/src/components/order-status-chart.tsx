"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const defaultData = [
  { name: "Pending", value: 0 },
  { name: "Processing", value: 0 },
  { name: "Paid", value: 0 },
  { name: "Shipped", value: 0 },
  { name: "Delivered", value: 0 },
  { name: "Cancelled", value: 0 },
]

const COLORS = ["#eab308", "#3b82f6", "#22c55e", "#a855f7", "#22c55e", "#ef4444"]

interface OrderStatusChartProps {
  data?: { name: string; value: number }[]
}

export function OrderStatusChart({ data = defaultData }: OrderStatusChartProps) {
  return (
    <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={60}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}