"use client"

import { useQuery } from "@tanstack/react-query"
import { inventoryColumns } from "@/components/columns/inventory-columns"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { exportToPDF } from "@/lib/export-utils"
import { useState, useEffect } from "react"

const PAGE_SIZE = 10

async function fetchInventory(page: number, limit: number) {
  const token = localStorage.getItem('token')
  const response = await fetch(`/api/inventory?limit=${limit}&offset=${page * limit}`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
    }
  })
  if (!response.ok) throw new Error("Failed to fetch inventory")
  return response.json()
}

export default function InventoryPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["inventory", page],
    queryFn: () => fetchInventory(page, PAGE_SIZE),
  })

  // Smart pagination: preload next page
  useEffect(() => {
    if (data && data.totalPages && page < data.totalPages - 1) {
      queryClient.prefetchQuery({
        queryKey: ["inventory", page + 1],
        queryFn: () => fetchInventory(page + 1, PAGE_SIZE),
        staleTime: 5 * 60 * 1000,
      })
    }
  }, [data, page, queryClient])

  const handleDelete = async (item: any) => {
    if (!confirm("Are you sure you want to delete this inventory item?")) return
    try {
      const token = localStorage.getItem('token')
      await fetch(`/api/inventory/${item.product_id}`, { 
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${token}` }
      })
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
    } catch (err) {
      alert("Failed to delete inventory item")
    }
  }

  const handleExport = () => {
    if (!data?.data) return
    exportToPDF(data.data, "inventory", "Inventory Report")
  }

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
            Failed to load inventory. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const inventoryData = data?.data || []
  const totalPages = data?.totalPages || 1

  return (
    <div className="flex-1 space-y-4 px-4 sm:px-6 lg:px-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Track stock levels and manage inventory
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-3 w-3 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>
      <DataTable 
        columns={inventoryColumns(undefined, handleDelete)} 
        data={inventoryData}
        pageCount={totalPages}
        currentPage={page}
        onPageChange={setPage}
      />
    </div>
  )
}