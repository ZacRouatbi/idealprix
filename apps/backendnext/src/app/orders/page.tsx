"use client"

import { useQuery } from "@tanstack/react-query"
import { orderColumns } from "@/components/columns/order-columns"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Download, Mail, Truck, MapPin, User, Package } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { exportToPDF } from "@/lib/export-utils"
import { Order, OrderStatus } from "@/services/order-service"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

async function getOrders() {
  const token = localStorage.getItem('token')
  const headers: HeadersInit = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const response = await fetch("/api/orders?limit=100", {
    headers,
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleExport = () => {
    if (!data?.data) return
    exportToPDF(data.data, "orders", "Orders Report")
  }

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      const token = localStorage.getItem('token')
      const headers: HeadersInit = { 
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status }),
      })
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || `HTTP ${response.status}`)
      }
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`)
    }
  }

  const handleSendEmail = async (order: Order) => {
    if (!confirm(`Send confirmation email to ${order.customer_email}?`)) return
    
    setEmailStatus(prev => ({ ...prev, [order.id]: "sending" }))
    try {
      const token = localStorage.getItem('token')
      const headers: HeadersInit = { 
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      const response = await fetch(`/api/orders/${order.id}/email`, {
        method: "POST",
        headers,
      })
      if (response.ok) {
        const result = await response.json()
        setEmailStatus(prev => ({ ...prev, [order.id]: "sent" }))
        alert(result.message || "Email sent successfully!")
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

  const handleRowClick = (order: Order) => {
    setSelectedOrder(order)
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
        onRowClick={handleRowClick}
      />
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Delivery Type:</span>
                <span className="text-sm">
                  {selectedOrder.shipping_provider?.name || "Standard"}
                </span>
              </div>
              
              {selectedOrder.shipping_provider?.phone && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Phone:</span>
                  <span className="text-sm">{selectedOrder.shipping_provider.phone}</span>
                </div>
              )}
              
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total:</span>
                  <span className="text-lg font-bold">
                    {selectedOrder.total_amount.toLocaleString("fr-TN")} TND
                  </span>
                </div>
              </div>
              
              {selectedOrder.notes && (
                <div className="border-t pt-2">
                  <div className="flex items-start gap-2">
                    <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-sm font-medium">Notes:</span>
                      <p className="text-sm text-muted-foreground mt-1">{selectedOrder.notes}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="border-t pt-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-sm font-medium">Shipping Address:</span>
                    {selectedOrder.shipping_address && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {selectedOrder.shipping_address.fullName && <div>{selectedOrder.shipping_address.fullName}</div>}
                        {selectedOrder.shipping_address?.address && <div>{selectedOrder.shipping_address.address}</div>}
                        {selectedOrder.shipping_address?.city && (
                          <div>
                            {selectedOrder.shipping_address.city} {selectedOrder.shipping_address.postalCode}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Email:</span>
                  <span className="text-sm">{selectedOrder.customer_email}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}