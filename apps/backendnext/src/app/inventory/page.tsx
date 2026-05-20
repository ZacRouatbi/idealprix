"use client"

import { useQuery } from "@tanstack/react-query"
import { inventoryColumns } from "@/components/columns/inventory-columns"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Download } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { exportToPDF } from "@/lib/export-utils"

async function getInventory() {
  const token = localStorage.getItem('token')
  const response = await fetch("/api/inventory?limit=100", {
    headers: { 
      'Authorization': `Bearer ${token}`,
    }
  })
  if (!response.ok) throw new Error("Failed to fetch inventory")
  return response.json()
}

export default function InventoryPage() {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["inventory"],
    queryFn: getInventory,
  })

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
  const totalCount = data?.count || 0
  const totalPages = Math.ceil(totalCount / 100) || 1

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground">
            Track stock levels and manage inventory
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
        </div>
      </div>
      <DataTable 
        columns={inventoryColumns(undefined, handleDelete)} 
        data={inventoryData}
        pageCount={totalPages}
      />
    </div>
  )
}