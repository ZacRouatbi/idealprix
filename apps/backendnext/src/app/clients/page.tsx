"use client"

import { useQuery } from "@tanstack/react-query"
import { clientColumns, Client } from "@/components/columns/client-columns"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Download, User, Mail, Phone, Calendar, Clock } from "lucide-react"
import { exportToPDF } from "@/lib/export-utils"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

async function getClients() {
  const token = localStorage.getItem('token')
  const response = await fetch("/api/clients?limit=100", {
    headers: { 
      'Authorization': `Bearer ${token}`,
    }
  })
  if (!response.ok) throw new Error("Failed to fetch clients")
  return response.json()
}

export default function ClientsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["clients"],
    queryFn: getClients,
  })

  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleExport = () => {
    if (!data?.data) return
    exportToPDF(data.data, "clients", "Clients Report")
  }

  const handleRowClick = (client: Client) => {
    setSelectedClient(client)
    setIsModalOpen(true)
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
      <DataTable columns={clientColumns} data={data?.data || []} onRowClick={handleRowClick} />
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Name:</span>
                <span className="text-sm">{selectedClient.first_name} {selectedClient.last_name}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm">{selectedClient.email}</span>
              </div>
              
              {selectedClient.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Phone:</span>
                  <span className="text-sm">{selectedClient.phone}</span>
                </div>
              )}
              
              <div className="border-t pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Role:</span>
                  <span className="text-sm capitalize">{selectedClient.role}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-medium">Status:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${selectedClient.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {selectedClient.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              {selectedClient.last_login && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Last Login:</span>
                  <span className="text-sm">{new Date(selectedClient.last_login).toLocaleString()}</span>
                </div>
              )}
              
              <div className="border-t pt-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm">{new Date(selectedClient.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}