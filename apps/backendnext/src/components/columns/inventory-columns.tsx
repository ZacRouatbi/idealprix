"use client"

import { ColumnDef } from "@tanstack/react-table"
import { InventoryItem } from "@/services/inventory-service"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"

export const inventoryColumns = (
  onEdit?: (item: InventoryItem) => void,
  onDelete?: (item: InventoryItem) => void,
  onAdjust?: (item: InventoryItem) => void
): ColumnDef<InventoryItem>[] => [
  {
    accessorKey: "product_name",
    header: "Product",
    cell: ({ row }) => {
      return <div className="font-medium">{row.getValue("product_name")}</div>
    },
  },
  {
    accessorKey: "product_sku",
    header: "SKU",
    cell: ({ row }) => {
      return <span className="text-muted-foreground">{row.getValue("product_sku")}</span>
    },
  },
  {
    accessorKey: "quantity",
    header: "Available",
    cell: ({ row }) => {
      const item = row.original
      const available = item.quantity - item.reserved_quantity
      const threshold = item.low_stock_threshold || 10
      return (
        <Badge variant={available > threshold ? "default" : available > 0 ? "secondary" : "destructive"}>
          {available}
        </Badge>
      )
    },
  },
  {
    accessorKey: "reserved_quantity",
    header: "Reserved",
    cell: ({ row }) => {
      return <span className="text-muted-foreground">{row.getValue("reserved_quantity")}</span>
    },
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => {
      const location = row.getValue("location") as string
      return <span className="text-muted-foreground">{location || "-"}</span>
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const item = row.original
      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <a href={`/inventory/${item.product_id}`}>
              <Edit className="h-4 w-4" />
            </a>
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(item)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      )
    },
  },
]