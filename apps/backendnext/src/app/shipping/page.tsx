"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { shippingColumns, ShippingProvider } from "@/components/columns/shipping-columns"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectItem } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Truck, Zap, Store } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"

function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem('token')
  }
  return null
}

async function fetchShippingProviders() {
  const token = getToken()
  const response = await fetch("/api/shipping", {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!response.ok) throw new Error("Failed to fetch shipping providers")
  return response.json()
}

export default function ShippingPage() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    price: "",
    service_type: "standard" as "standard" | "express" | "pickup",
  })

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["shipping"],
    queryFn: fetchShippingProviders,
  })

  const handleDelete = async (provider: ShippingProvider) => {
    if (!confirm("Are you sure you want to delete this shipping provider?")) return
    try {
      const token = getToken()
      await fetch(`/api/shipping/${provider.id}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${token}` }
      })
      queryClient.invalidateQueries({ queryKey: ["shipping"] })
    } catch (err) {
      alert("Failed to delete shipping provider")
    }
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.price || !formData.service_type) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const token = getToken()
      const response = await fetch('/api/shipping', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone || null,
          price: parseInt(formData.price),
          service_type: formData.service_type,
        }),
      })

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["shipping"] })
        setFormData({ name: "", phone: "", price: "", service_type: "standard" })
        setFormOpen(false)
        alert(`Shipping provider ${formData.name} created successfully!`)
      }
    } catch (err) {
      alert("Failed to create shipping provider")
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
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
      <div className="flex-1 space-y-4 px-4 sm:px-6 lg:px-8 pt-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load shipping providers. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const shippingData = data?.data || []

  return (
    <div className="flex-1 space-y-4 px-4 sm:px-6 lg:px-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Shipping Providers</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage delivery options and shipping methods
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Add Provider
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Shipping Options</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <DataTable 
            columns={shippingColumns(handleDelete, undefined)} 
            data={shippingData}
            pageCount={1}
          />
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="w-[95vw] max-w-lg mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Add Shipping Provider</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g., Aramex"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone (optional)</label>
              <Input
                placeholder="e.g., +216 71 123 456"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Service Type</label>
              <Select 
                value={formData.service_type} 
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value as "standard" | "express" | "pickup" })}
              >
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="express">Express</SelectItem>
                <SelectItem value="pickup">Store Pickup</SelectItem>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Price (DT)</label>
              <Input
                type="number"
                placeholder="e.g., 7000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} className="text-xs sm:text-sm">
              Cancel
            </Button>
            <Button onClick={handleCreate} className="text-xs sm:text-sm">
              Create Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}