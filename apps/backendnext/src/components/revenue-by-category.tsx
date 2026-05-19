"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { name: "Vaisselle", revenue: 45000 },
  { name: "Nettoyage", revenue: 32000 },
  { name: "Cosmétiques", revenue: 28000 },
  { name: "Épicerie", revenue: 15000 },
  { name: "Décor", revenue: 12000 },
]

export function RevenueByCategory() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="revenue" fill="#1E40AF" />
      </BarChart>
    </ResponsiveContainer>
  )
}