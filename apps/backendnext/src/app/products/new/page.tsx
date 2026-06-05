"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"

async function getCategories() {
  const response = await fetch("/api/categories")
  if (!response.ok) throw new Error("Failed to fetch categories")
  return response.json()
}

export default function ProductNewPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    compare_price: "",
    category_id: "",
    sku: "",
    stock_quantity: "0",
    low_stock_threshold: "10",
    is_active: true,
    is_featured: false,
    image: null as File | null,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, image: file })
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const data = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'image') {
          data.append(key, value as string)
        }
      })
      if (formData.image) {
        data.append('image', formData.image)
      }

      const response = await fetch("/api/products", {
        method: "POST",
        body: data,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to create product`)
      }

      router.push("/products")
    } catch (err: any) {
      setError(err.message || "Failed to create product")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 px-4 sm:px-6 lg:px-8 pt-6 overflow-hidden">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg -z-10 animate-pulse"></div>
        <div className="flex items-center gap-4 mb-4 px-4 pb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/products">
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Link>
          </Button>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Add New Product
        </h2>
      </div>

      {error && (
        <Alert variant="destructive" className="mx-4 sm:mx-0">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="auto-generated from name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (TND)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compare_price">Compare Price</Label>
                  <Input
                    id="compare_price"
                    type="number"
                    step="0.01"
                    value={formData.compare_price}
                    onChange={(e) => setFormData({ ...formData, compare_price: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock_quantity">Stock Quantity</Label>
                  <Input
                    id="stock_quantity"
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                <Select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}>
                  {categoriesData?.data?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                <Input
                  id="low_stock_threshold"
                  type="number"
                  value={formData.low_stock_threshold}
                  onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Product Image</Label>
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded" loading="lazy" />
                  )}
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Label htmlFor="image" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 border rounded-md hover:bg-gray-50">
                      <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm">Upload Image</span>
                    </div>
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Featured</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label htmlFor="is_featured">Featured Product</Label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button type="submit" disabled={isLoading} size="lg" className="px-8 sm:px-12">
              {isLoading ? "Creating..." : "Create Product"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}