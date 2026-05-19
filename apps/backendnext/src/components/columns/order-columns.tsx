"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Order, OrderStatus } from "@/services/order-service"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem } from "@/components/ui/select"
import { Mail } from "lucide-react"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  paid: "bg-emerald-100 text-emerald-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

const statusOrder: OrderStatus[] = ["pending", "processing", "paid", "shipped", "delivered", "cancelled"]

export const orderColumns = (
  onStatusChange?: (orderId: string, status: OrderStatus) => void,
  onSendEmail?: (order: Order) => void
): ColumnDef<Order>[] => [
  {
    accessorKey: "order_number",
    header: "#",
  },
  {
    accessorKey: "customer_email",
    header: "Customer",
    cell: ({ row }) => {
      const order = row.original
      return (
        <div>
          <div className="font-medium">{order.customer_name || "Guest"}</div>
          <div className="text-sm text-muted-foreground">{order.customer_email}</div>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const order = row.original
      return (
        <Select
          value={order.status}
          onChange={(e) => onStatusChange?.(order.id, e.target.value as OrderStatus)}
        >
          <SelectContent>
            {statusOrder.map((status) => (
              <SelectItem key={status} value={status}>
                <Badge className={statusColors[status] || ""}>
                  {status}
                </Badge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    },
  },
  {
    accessorKey: "total_amount",
    header: "Total",
    cell: ({ row }) => {
      const total = row.getValue("total_amount") as number
      return <div>{total.toLocaleString("fr-TN")} TND</div>
    },
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"))
      return <div>{date.toLocaleDateString()}</div>
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const order = row.original
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSendEmail?.(order)}
        >
          <Mail className="h-4 w-4" />
        </Button>
      )
    },
  },
]