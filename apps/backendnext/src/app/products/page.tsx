"use client"

import { useState, useEffect } from "react"
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

const PAGE_SIZE = 10

async function fetchProducts(page: number, limit: number) {
  const token = localStorage.getItem('token')
  const offset = (page) * limit
  const response = await fetch(`/api/products?limit=${limit}&offset=${offset}&_=${Date.now()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  })
  if (!response.ok) throw new Error("Failed to fetch products")
  return response.json()
}

export default function ProductsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["products", page],
    queryFn: () => fetchProducts(page, PAGE_SIZE),
  })

  // Smart pagination: preload next page
  useEffect(() => {
    if (data && data.totalPages && page < data.totalPages - 1) {
      queryClient.prefetchQuery({
        queryKey: ["products", page + 1],
        queryFn: () => fetchProducts(page + 1, PAGE_SIZE),
      })
    }
  }, [data, page, queryClient])

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

  const totalPages = data?.totalPages || 1

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

  return (
    <div className="flex-1 space-y-4 px-4 sm:px-6 lg:px-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your product catalog
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
            <Link href="/products/new">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>
      <DataTable 
        columns={productColumns(handleDelete)} 
        data={data?.data || []}
        pageCount={totalPages}
        currentPage={page}
        onPageChange={setPage}
      />
    </div>
  )
}