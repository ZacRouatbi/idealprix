"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { name: "Jan", total: 12000 },
  { name: "Feb", total: 19000 },
  { name: "Mar", total: 15000 },
  { name: "Apr", total: 18000 },
  { name: "May", total: 22000 },
  { name: "Jun", total: 25000 },
  { name: "Jul", total: 28000 },
  { name: "Aug", total: 31000 },
  { name: "Sep", total: 27000 },
  { name: "Oct", total: 24000 },
  { name: "Nov", total: 29000 },
  { name: "Dec", total: 32000 },
]

export function SalesChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="total" stroke="#1E40AF" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}