"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const defaultData = [
  { name: "Jan", total: 0 },
  { name: "Feb", total: 0 },
  { name: "Mar", total: 0 },
  { name: "Apr", total: 0 },
  { name: "May", total: 0 },
  { name: "Jun", total: 0 },
  { name: "Jul", total: 0 },
  { name: "Aug", total: 0 },
  { name: "Sep", total: 0 },
  { name: "Oct", total: 0 },
  { name: "Nov", total: 0 },
  { name: "Dec", total: 0 },
]

interface SalesChartProps {
  data?: { name: string; total: number }[]
}

export function SalesChart({ data = defaultData }: SalesChartProps) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[300px] sm:min-w-0">
        <ResponsiveContainer width="100%" height={250} className="sm:h-[350px]">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value: number) => [`${value.toLocaleString('fr-TN')} TND`, 'Revenue']} />
            <Line type="monotone" dataKey="total" stroke="#1E40AF" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}