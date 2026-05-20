"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { productColumns } from "@/components/columns/product-columns"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Plus, Download, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useQueryClient } from "@tanstack/react-query"
import { exportToPDF } from "@/lib/export-utils"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

export default function ProductsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [limit, setLimit] = useState(10)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["products", page, limit],
    queryFn: async () => {
      const offset = page * limit
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/products?limit=${limit}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
      if (!response.ok) throw new Error("Failed to fetch products")
      return response.json()
    },
  })

  const handleDelete = async (product: any) => {
    if (!confirm("Are you sure you want to delete this product?")) return
    try {
      const token = localStorage.getItem('token')
      await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${token}` }
      })
      queryClient.invalidateQueries({ queryKey: ["products"] })
    } catch (err) {
      alert("Failed to delete product")
    }
  }

  const handleExport = () => {
    if (!data?.data) return
    exportToPDF(data.data, "products", "Products Report")
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    queryClient.invalidateQueries({ queryKey: ["products"] })
  }

  const totalPages = Math.ceil((data?.count || 0) / limit)

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
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
            Failed to load products. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const productsWithActions = (data?.data || [])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">
            Manage your product catalog
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button asChild>
            <Link href="/products/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>
      <DataTable columns={productColumns(handleDelete)} data={productsWithActions} />
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handlePageChange(0)} disabled={page === 0}>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handlePageChange(page - 1)} disabled={page === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">Page {page + 1} of {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages - 1}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => handlePageChange(totalPages - 1)} disabled={page >= totalPages - 1}>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
