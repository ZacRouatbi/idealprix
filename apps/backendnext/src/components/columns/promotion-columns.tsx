"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Calendar, Tag } from "lucide-react"

export type Promotion = {
  id: string
  targetType: "product" | "category"
  targetId: string
  targetName: string
  discountType: "percentage" | "fixed"
  discountValue: number
  startDate: string
  endDate: string
  isActive: boolean
}

const safeFormatDate = (dateString: string) => {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return "Invalid date"
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

export const promotionColumns = (onDelete?: (promotion: Promotion) => void): ColumnDef<Promotion>[] => [
  {
    accessorKey: "targetType",
    header: "Target Type",
    cell: ({ row }) => {
      const targetType = row.original.targetType
      return (
        <Badge variant={targetType === "product" ? "default" : "secondary"}>
          {targetType === "product" ? "Product" : "Category"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "targetName",
    header: "Target",
    cell: ({ row }) => {
      const { targetName, targetType } = row.original
      return (
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{targetName}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "discountType",
    header: "Discount",
    cell: ({ row }) => {
      const { discountType, discountValue } = row.original
      return (
        <div className="font-medium">
          {discountType === "percentage" ? `${discountValue}%` : `${(discountValue || 0).toLocaleString()} DT`}
        </div>
      )
    },
  },
  {
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ row }) => (
      <div className="text-sm">{safeFormatDate(row.original.startDate)}</div>
    ),
  },
  {
    accessorKey: "endDate",
    header: "End Date",
    cell: ({ row }) => (
      <div className="text-sm">{safeFormatDate(row.original.endDate)}</div>
    ),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const { isActive, startDate, endDate } = row.original
      const start = new Date(startDate)
      const end = new Date(endDate)
      const now = new Date()
      
      let status: "active" | "inactive" | "scheduled" | "expired"
      
      if (!isActive) {
        status = "inactive"
      } else if (now < start) {
        status = "scheduled"
      } else if (now > end) {
        status = "expired"
      } else {
        status = "active"
      }
      
      const variants = {
        active: "default",
        inactive: "outline",
        scheduled: "secondary",
        expired: "destructive",
      } as const
      
      return (
        <Badge variant={variants[status]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const promotion = row.original

      return (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(promotion)}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          )}
        </div>
      )
    },
  },
]