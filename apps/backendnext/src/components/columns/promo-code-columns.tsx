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

export const promoCodeColumns = (): ColumnDef<PromoCode>[] => [
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
            onClick={() => navigator.clipboard.writeText(code)}
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
          {discountType === "percentage" ? `${discountValue}%` : `${discountValue.toLocaleString()} DT`}
        </div>
      )
    },
  },
  {
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ row }) => {
      const date = new Date(row.original.startDate)
      return (
        <div className="text-sm">
          {format(date, "dd MMM yyyy")}
        </div>
      )
    },
  },
  {
    accessorKey: "endDate",
    header: "End Date",
    cell: ({ row }) => {
      const date = new Date(row.original.endDate)
      return (
        <div className="text-sm">
          {format(date, "dd MMM yyyy")}
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
      return (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
]