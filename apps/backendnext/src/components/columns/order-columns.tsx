"use client"

import { ColumnDef } from "@tanstack/react-table"
import { OrderStatus, OrderWithItems } from "@/services/order-service"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Mail, Package, Truck, CheckCircle, XCircle } from "lucide-react"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  paid: "bg-emerald-100 text-emerald-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Package className="h-4 w-4" />,
  processing: <Package className="h-4 w-4" />,
  paid: <CheckCircle className="h-4 w-4" />,
  shipped: <Truck className="h-4 w-4" />,
  delivered: <CheckCircle className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
}

const nextStatusMap: Record<string, string[]> = {
  pending: ["processing", "cancelled"],
  processing: ["paid", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
}

export const orderColumns = (
  onStatusChange?: (orderId: string, status: OrderStatus) => void,
  onSendEmail?: (order: OrderWithItems) => void
): ColumnDef<OrderWithItems>[] => [
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
        <Badge className={statusColors[order.status] || ""}>
          {order.status}
        </Badge>
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
      const nextStatuses = nextStatusMap[order.status] || []

      return (
        <div className="flex items-center gap-1">
          {nextStatuses.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  {statusIcons[order.status]}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {nextStatuses.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={(e) => {
                      e.stopPropagation()
                      onStatusChange?.(order.id, status as OrderStatus)
                    }}
                    className="cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      {statusIcons[status]}
                      {status}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onSendEmail?.(order)
            }}
          >
            <Mail className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
]