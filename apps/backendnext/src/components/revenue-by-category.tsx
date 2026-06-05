"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const defaultData = [
  { name: "No data", revenue: 0 },
]

interface RevenueByCategoryProps {
  data?: { name: string; revenue: number }[]
}

export function RevenueByCategory({ data = defaultData }: RevenueByCategoryProps) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[300px] sm:min-w-0">
        <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value: number) => [`${value.toLocaleString('fr-TN')} TND`, 'Revenue']} />
            <Bar dataKey="revenue" fill="#1E40AF" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}