"use client"

import { useQuery } from "@tanstack/react-query"
import { clientColumns } from "@/components/columns/client-columns"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Download } from "lucide-react"
import { exportToPDF } from "@/lib/export-utils"

async function getClients() {
  const response = await fetch("/api/clients?limit=100")
  if (!response.ok) throw new Error("Failed to fetch clients")
  return response.json()
}

export default function ClientsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["clients"],
    queryFn: getClients,
  })

  const handleExport = () => {
    if (!data?.data) return
    exportToPDF(data.data, "clients", "Clients Report")
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
            Failed to load clients. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
          <p className="text-muted-foreground">
            Manage your customer base
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
      <DataTable columns={clientColumns} data={data?.data || []} />
    </div>
  )
}