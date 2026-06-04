"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Copy, Calendar } from "lucide-react"
import { format } from "date-fns"

export type PromoCode = {
  id: string
  code: string
  discountType: "percentage" | "fixed"
  discountValue: number
  startDate: string
  endDate: string
  minOrderValue: number
  usageLimit?: number
  usedCount: number
  isActive: boolean
}

// Helper to safely format a date string, returning a fallback if invalid
const safeFormat = (dateString: string, formatStr: string) => {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    return "Invalid date"
  }
  return format(date, formatStr)
}

export const promoCodeColumns = (
  onDelete?: (promoCode: PromoCode) => void,
  onEdit?: (promoCode: PromoCode) => void
): ColumnDef<PromoCode>[] => [
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => {
      const code = row.original.code
      return (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono">
            {code}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(code)
              } catch (err) {
                // Fallback: show a prompt to copy manually
                // avoid throwing - keep UI responsive
                // eslint-disable-next-line no-alert
                alert(`Copy this code: ${code}`)
              }
            }}
            className="h-6 w-6 p-0"
          >
            <Copy className="h-3 w-3" />
          </Button>
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
    cell: ({ row }) => {
      return (
        <div className="text-sm">
          {safeFormat(row.original.startDate, "dd MMM yyyy")}
        </div>
      )
    },
  },
  {
    accessorKey: "endDate",
    header: "End Date",
    cell: ({ row }) => {
      return (
        <div className="text-sm">
          {safeFormat(row.original.endDate, "dd MMM yyyy")}
        </div>
      )
    },
  },
  {
    accessorKey: "usageLimit",
    header: "Usage",
    cell: ({ row }) => {
      const { usedCount, usageLimit } = row.original
      
      if (usageLimit) {
        const percentage = Math.round((usedCount / usageLimit) * 100)
        return (
          <div className="text-sm">
            {usedCount} / {usageLimit}
            <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full" 
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      }
      return <span className="text-muted-foreground">{usedCount} uses</span>
    },
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
      const promoCode = row.original
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit && onEdit(promoCode)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(promoCode)}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          )}
        </div>
      )
    },
  },
]