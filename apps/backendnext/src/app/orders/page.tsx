"use client"

import { useQuery } from "@tanstack/react-query"
import { orderColumns } from "@/components/columns/order-columns"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Download, Mail } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { exportToPDF } from "@/lib/export-utils"
import { Order, OrderStatus } from "@/services/order-service"
import { useState } from "react"

async function getOrders() {
  const token = localStorage.getItem('token')
  const response = await fetch("/api/orders?limit=100", {
    headers: { 
      'Authorization': `Bearer ${token}`,
    }
  })
  if (!response.ok) throw new Error("Failed to fetch orders")
  return response.json()
}

export default function OrdersPage() {
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
  })

  const [emailStatus, setEmailStatus] = useState<Record<string, "idle" | "sending" | "sent" | "error">>({})

  const handleExport = () => {
    if (!data?.data) return
    exportToPDF(data.data, "orders", "Orders Report")
  }

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { 
          'Authorization': `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || `HTTP ${response.status}`)
      }
      queryClient.invalidateQueries({ queryKey: ["orders"] })
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`)
    }
  }

  const handleSendEmail = async (order: Order) => {
    setEmailStatus(prev => ({ ...prev, [order.id]: "sending" }))
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/orders/${order.id}/email`, {
        method: "POST",
        headers: { 
          'Authorization': `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      if (response.ok) {
        setEmailStatus(prev => ({ ...prev, [order.id]: "sent" }))
        setTimeout(() => {
          setEmailStatus(prev => ({ ...prev, [order.id]: "idle" }))
        }, 2000)
      } else {
        throw new Error("Failed to send email")
      }
    } catch (err) {
      setEmailStatus(prev => ({ ...prev, [order.id]: "error" }))
      alert("Failed to send email")
    }
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
            Failed to load orders. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground">
            Manage customer orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>
      <DataTable 
        columns={orderColumns(handleStatusChange, handleSendEmail)} 
        data={data?.data || []} 
      />
    </div>
  )
}