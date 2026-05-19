"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Category } from "@/services/category-service"

async function getCategories() {
  const response = await fetch("/api/categories?limit=100")
  if (!response.ok) throw new Error("Failed to fetch categories")
  return response.json()
}

export default function CategoryNewPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [categoryName, setCategoryName] = useState("")
  const [categoryDescription, setCategoryDescription] = useState("")
  const [categoryParentId, setCategoryParentId] = useState<string | undefined>(undefined)

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  })

  const topLevelCategories = (categoriesData?.data || []).filter((c: Category) => !c.parent_id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: categoryName,
          description: categoryDescription,
          parent_id: categoryParentId || null
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create category")
      }

      queryClient.invalidateQueries({ queryKey: ["categories"] })
      router.push("/categories")
    } catch (err: any) {
      setError(err.message || "Failed to create category")
    } finally {
      setIsLoading(false)
    }
  }

return (
    <div className="flex-1 space-y-4 p-8 pt-6 overflow-hidden">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg -z-10 animate-pulse"></div>
        <div className="flex items-center gap-4 mb-4 p-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/categories">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
        <h2 className="text-3xl font-bold tracking-tight px-4 pb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Add Category
        </h2>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={categoryDescription}
              onChange={(e) => setCategoryDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent_id">Parent Category (optional)</Label>
            <select
              id="parent_id"
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              value={categoryParentId || ""}
              onChange={(e) => setCategoryParentId(e.target.value || undefined)}
            >
              <option value="">No parent (top level)</option>
              {topLevelCategories.map((c: Category) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Category"}
          </Button>
        </div>
      </form>
    </div>
  )
}