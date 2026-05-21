"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { InventoryItem } from "@/services/inventory-service"

async function getInventoryItem(productId: string) {
  const token = localStorage.getItem('token')
  const response = await fetch(`/api/inventory/${productId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  })
  if (!response.ok) throw new Error("Failed to fetch inventory item")
  return response.json()
}

export default function InventoryAdjustPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [id, setId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [adjustAmount, setAdjustAmount] = useState(0)
  const [location, setLocation] = useState("")

  useEffect(() => {
    params.then(({ id }) => setId(id))
  }, [params])

  const { data: item, isLoading: isLoadingItem } = useQuery({
    queryKey: ["inventory", id],
    queryFn: () => getInventoryItem(id),
    enabled: !!id,
  })

  useEffect(() => {
    if (item) {
      setAdjustAmount(item.quantity || 0)
      setLocation(item.location || "")
    }
  }, [item])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/inventory/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: adjustAmount, location }),
      })

      if (!response.ok) {
        throw new Error("Failed to update inventory")
      }

      queryClient.invalidateQueries({ queryKey: ["inventory"] })
      router.push("/inventory")
    } catch (err: any) {
      setError(err.message || "Failed to update inventory")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingItem) return <div className="p-8">Loading...</div>

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 overflow-hidden">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg -z-10 animate-pulse"></div>
        <div className="flex items-center gap-4 mb-4 p-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/inventory">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
        <h2 className="text-3xl font-bold tracking-tight px-4 pb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Adjust Inventory
        </h2>
      </div>

      {item && (
        <p className="text-muted-foreground">Adjusting stock for {item.product_name}</p>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="h-full overflow-y-auto">
        <div className="max-w-md mx-auto space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Warehouse A, Shelf 3"
            />
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}