"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Truck, Zap, Store } from "lucide-react"

export type ShippingProvider = {
  id: string
  name: string
  phone?: string
  price: number
  service_type: "standard" | "express" | "pickup"
  is_active: boolean
}

const safeFormatPrice = (price: number) => {
  if (price === 0) return "Free"
  return `${price.toLocaleString()} DT`
}

const getServiceIcon = (type: string) => {
  switch (type) {
    case "express": return Zap
    case "pickup": return Store
    default: return Truck
  }

}

const getServiceLabel = (type: string) => {
  switch (type) {
    case "express": return "Express"
    case "pickup": return "Pickup"
    default: return "Standard"
  }

}

export const shippingColumns = (
  onDelete?: (provider: ShippingProvider) => void,
  onEdit?: (provider: ShippingProvider) => void
): ColumnDef<ShippingProvider>[] => [
  {
    accessorKey: "name",
    header: "Provider",
    cell: ({ row }) => {
      const provider = row.original
      const Icon = getServiceIcon(provider.service_type)
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="font-medium">{provider.name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "service_type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.service_type
      return (
        <Badge variant="outline">
          {getServiceLabel(type)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = row.original.price
      return (
        <span className="font-medium">{safeFormatPrice(price)}</span>
      )
    },
  },
  {
    accessorKey: "phone",
    header: "Contact",
    cell: ({ row }) => {
      return row.original.phone || <span className="text-muted-foreground">-</span>
    },
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.original.is_active
      return (
        <Badge variant={isActive ? "default" : "outline"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const provider = row.original

      return (
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(provider)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(provider)}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          )}
        </div>
      )
    },
  },
]