"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { DataTable } from "@/components/data-table"
import { categoryColumns } from "@/components/columns/category-columns"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Plus, RefreshCw } from "lucide-react"
import { Category } from "@/services/category-service"
import { useQueryClient } from "@tanstack/react-query"
import { exportToPDF } from "@/lib/export-utils"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

function getRootCategories(categories: Category[]): (Category & { children: (Category & { parent_name?: string })[] })[] {
  const map = new Map<string, Category & { children: (Category & { parent_name?: string })[] }>()
  const roots: (Category & { children: (Category & { parent_name?: string })[] })[] = []

  categories.forEach(c => map.set(c.id, { ...c, children: [] }))

  map.forEach((cat) => {
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children.push({ ...cat, parent_name: map.get(cat.parent_id)!.name })
    } else {
      roots.push(cat)
    }
  })

  return roots
}

export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [limit, setLimit] = useState(50)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["categories", page, limit],
    queryFn: async () => {
      const offset = page * limit
      const response = await fetch(`/api/categories?limit=${limit}&offset=${offset}`)
      if (!response.ok) throw new Error("Failed to fetch categories")
      return response.json()
    },
  })

  const handleDelete = async (category: Category) => {
    if (!confirm("Are you sure you want to delete this category?")) return
    try {
      await fetch(`/api/categories/${category.id}`, { method: "DELETE" })
      refetch()
    } catch (err) {
      alert("Failed to delete category")
    }
  }

  const handleExport = () => {
    if (!data?.data) return
    exportToPDF(data.data, "categories", "Categories Report")
  }

  const categoriesData = data?.data || []
  const totalCount = data?.count || 0
  const totalPages = Math.ceil(totalCount / limit) || 1

  const roots = getRootCategories(categoriesData)

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load categories. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground">
            Organize your products by category
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button asChild>
            <a href="/categories/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </a>
          </Button>
        </div>
      </div>
      <DataTable
        columns={categoryColumns(handleDelete, (cat) => cat.children || [])}
        data={roots}
        pageCount={totalPages}
        getChildren={(cat) => cat.children || []}
      />
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(0)} disabled={page === 0}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
