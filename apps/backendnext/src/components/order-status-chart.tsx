"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const data = [
  { name: "Delivered", value: 45 },
  { name: "Processing", value: 25 },
  { name: "Shipped", value: 15 },
  { name: "Pending", value: 10 },
  { name: "Cancelled", value: 5 },
]

const COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#eab308", "#ef4444"]

export function OrderStatusChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
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