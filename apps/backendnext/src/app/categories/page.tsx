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
import { exportToPDF } from "@/lib/export-utils"

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
  const [limit, setLimit] = useState(50)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/categories?limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error("Failed to fetch categories")
      return response.json()
    },
  })

  const handleDelete = async (category: Category) => {
    if (!confirm("Are you sure you want to delete this category?")) return
    try {
      const token = localStorage.getItem('token')
      await fetch(`/api/categories/${category.id}`, { 
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${token}` }
      })
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
    <div className="flex-1 space-y-4 px-4 sm:px-6 lg:px-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Organize your products by category
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-3 w-3 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button asChild size="sm">
            <a href="/categories/new">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Add Category
            </a>
          </Button>
        </div>
      </div>
      <DataTable
        columns={categoryColumns(handleDelete, (cat) => cat.children || [])}
        data={roots}
        getChildren={(cat) => cat.children || []}
      />
    </div>
  )
}