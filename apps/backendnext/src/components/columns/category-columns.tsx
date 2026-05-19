"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Category } from "@/services/category-service"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, ChevronDown, ChevronRight } from "lucide-react"

export const categoryColumns = (
  onDelete?: (category: Category) => void,
  getChildrenFn?: (category: Category) => Category[]
): ColumnDef<Category>[] => [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      const category = row.original
      const hasChildren = getChildrenFn ? getChildrenFn(category).length > 0 : (category.children && category.children.length > 0)
      return (
        <div className="flex items-center gap-1 font-medium">
          {hasChildren ? (
            <button
              className="flex-shrink-0 p-0.5 hover:bg-muted rounded"
              onClick={(e) => {
                e.stopPropagation()
                row.toggleExpanded()
              }}
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}
          {row.getValue("name") as string}
        </div>
      )
    },
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => {
      return (
        <span className="text-muted-foreground text-sm">
          {row.getValue("slug") as string}
        </span>
      )
    },
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "parent_id",
    header: "Parent",
    cell: ({ row }) => {
      const parentId = row.getValue("parent_id") as string
      if (!parentId) return <span className="text-muted-foreground">Root</span>
      const parentName = (row.original as any).parent_name
      return <span className="text-muted-foreground">{parentName || parentId}</span>
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const category = row.original
      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
          >
            <a href={`/categories/${category.id}`}>
              <Edit className="h-4 w-4" />
            </a>
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(category)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      )
    },
  },
]
