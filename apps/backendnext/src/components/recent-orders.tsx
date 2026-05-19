"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Package } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  customer_name?: string
  customer_email?: string
  created_at: string
}

interface RecentOrdersProps {
  orders?: Order[]
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  const data = orders && orders.length > 0 ? orders : []

  if (data.length === 0) {
    return (
      <EmptyState
        icon={<Package className="h-8 w-8 text-muted-foreground" />}
        title="No orders yet"
        description="Orders will appear here once customers start placing them."
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
        <CardDescription>Latest customer orders</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.order_number}</TableCell>
                <TableCell>{order.customer_name || order.customer_email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[order.status] || ''}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {order.total_amount.toLocaleString('fr-TN')} TND
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}