"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { promotionColumns, Promotion } from "@/components/columns/promotion-columns"
import { promoCodeColumns, PromoCode } from "@/components/columns/promo-code-columns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectItem } from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { Plus, RefreshCw, Search, Ticket, Tag, Percent, DollarSign } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useReactTable, getCoreRowModel, getSortedRowModel, SortingState, ColumnFiltersState, getFilteredRowModel } from "@tanstack/react-table"

function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem('token')
  }
  return null
}

async function fetchPromotions() {
  const token = getToken()
  const response = await fetch(`/api/promotions?limit=100`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!response.ok) throw new Error("Failed to fetch promotions")
  return response.json()
}

async function fetchPromoCodes() {
  const token = getToken()
  const response = await fetch(`/api/promo-codes?limit=100`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!response.ok) throw new Error("Failed to fetch promo codes")
  return response.json()
}

async function fetchProducts() {
  const token = getToken()
  const response = await fetch(`/api/products?limit=100`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!response.ok) throw new Error("Failed to fetch products")
  return response.json()
}

async function fetchCategories() {
  const token = getToken()
  const response = await fetch(`/api/categories?limit=100`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!response.ok) throw new Error("Failed to fetch categories")
  return response.json()
}

export default function PromotionsPage() {
  const queryClient = useQueryClient()
  const [sorting, setSorting] = useState<SortingState>([])
  const [promoCodeFilters, setPromoCodeFilters] = useState<ColumnFiltersState>([])
  const [promoCodeData, setPromoCodeData] = useState({
    code: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    minOrderValue: "",
    startDate: "",
    endDate: "",
    usageLimit: "",
  })
  const [discountForm, setDiscountForm] = useState({
    targetType: "product",
    targetId: "",
    targetName: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    startDate: "",
    endDate: "",
  })

  const { data: promotions, isLoading: promotionsLoading, error: promotionsError, refetch: refetchPromotions } = useQuery({
    queryKey: ["promotions"],
    queryFn: fetchPromotions,
  })

  const { data: promoCodes, isLoading: promoCodesLoading, error: promoCodesError } = useQuery({
    queryKey: ["promo-codes"],
    queryFn: fetchPromoCodes,
  })

  const { data: products } = useQuery({
    queryKey: ["products-search"],
    queryFn: fetchProducts,
  })

  const { data: categories } = useQuery({
    queryKey: ["categories-search"],
    queryFn: fetchCategories,
  })

  const productOptions: { value: string; label: string }[] = (products?.data || []).map((p: any) => ({
    value: p.id,
    label: `${p.name} (${p.sku || 'N/A'}) - ${parseFloat(p.price).toLocaleString()} TND`,
  }))

  const categoryOptions: { value: string; label: string }[] = (categories?.data || []).map((c: any) => ({
    value: c.id,
    label: c.name,
  }))

  const targetOptions = discountForm.targetType === "product" ? productOptions : categoryOptions

  const handleDeletePromotion = async (promotion: Promotion) => {
    if (!confirm("Are you sure you want to delete this promotion?")) return
    try {
      const token = getToken()
      await fetch(`/api/promotions/${promotion.id}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${token}` }
      })
      queryClient.invalidateQueries({ queryKey: ["promotions"] })
    } catch (err) {
      alert("Failed to delete promotion")
    }
  }

  const handleCreatePromoCode = async () => {
    if (!promoCodeData.code || !promoCodeData.discountValue || !promoCodeData.startDate || !promoCodeData.endDate) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const token = getToken()
      const response = await fetch('/api/promo-codes', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: promoCodeData.code,
          discountType: promoCodeData.discountType,
          discountValue: parseFloat(promoCodeData.discountValue),
          startDate: new Date(promoCodeData.startDate).toISOString(),
          endDate: new Date(promoCodeData.endDate).toISOString(),
          minOrderValue: promoCodeData.minOrderValue ? parseFloat(promoCodeData.minOrderValue) : 0,
          usageLimit: promoCodeData.usageLimit ? parseInt(promoCodeData.usageLimit) : undefined,
          isActive: true,
        }),
      })

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["promo-codes"] })
        setPromoCodeData({
          code: "",
          discountType: "percentage",
          discountValue: "",
          minOrderValue: "",
          startDate: "",
          endDate: "",
          usageLimit: "",
        })
        alert(`Promo code ${promoCodeData.code} created successfully!`)
      }
    } catch (err) {
      alert("Failed to create promo code")
    }
  }

  const handleApplyDiscount = async () => {
    if (!discountForm.targetId || !discountForm.discountValue || !discountForm.startDate || !discountForm.endDate) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const token = getToken()
      const response = await fetch('/api/promotions', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetType: discountForm.targetType,
          targetId: discountForm.targetId,
          targetName: discountForm.targetName || discountForm.targetId,
          discountType: discountForm.discountType,
          discountValue: parseFloat(discountForm.discountValue),
          startDate: new Date(discountForm.startDate).toISOString(),
          endDate: new Date(discountForm.endDate).toISOString(),
          isActive: true,
        }),
      })

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["promotions"] })
        setDiscountForm({
          targetType: "product",
          targetId: "",
          targetName: "",
          discountType: "percentage",
          discountValue: "",
          startDate: "",
          endDate: "",
        })
        alert("Discount applied successfully!")
      }
    } catch (err) {
      alert("Failed to apply discount")
    }
  }

  const promotionsTable = useReactTable({
    data: promotions?.data || [],
    columns: promotionColumns(handleDeletePromotion),
    state: {
      sorting,
      columnFilters: [],
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const promoCodesTable = useReactTable({
    data: promoCodes?.data || [],
    columns: promoCodeColumns(),
    state: {
      columnFilters: promoCodeFilters,
    },
    onColumnFiltersChange: setPromoCodeFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  if (promotionsLoading || promoCodesLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (promotionsError || promoCodesError) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load promotions. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Promotions</h2>
          <p className="text-muted-foreground">
            Manage discounts and promotional offers
          </p>
        </div>
        <Button variant="outline" onClick={() => refetchPromotions()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Discount Management
            </CardTitle>
            <CardDescription>
              Apply discounts to products or entire categories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Type</label>
                <Select value={discountForm.targetType} onChange={(e) => setDiscountForm({...discountForm, targetType: e.target.value as "product" | "category", targetId: "", targetName: ""})}>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Product/Category</label>
                <Combobox
                  options={targetOptions}
                  value={discountForm.targetId}
                  onChange={(v) => {
                    const found = targetOptions.find(o => o.value === v)
                    setDiscountForm({
                      ...discountForm,
                      targetId: v,
                      targetName: found ? found.label : v,
                    })
                  }}
                  placeholder="Select..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Discount Type</label>
                <Select value={discountForm.discountType} onChange={(e) => setDiscountForm({...discountForm, discountType: e.target.value as "percentage" | "fixed"})}>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (DT)</SelectItem>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Discount Value</label>
                <Input
                  type="number"
                  placeholder="Enter value (e.g., 10 or 5000)"
                  value={discountForm.discountValue}
                  onChange={(e) => setDiscountForm({...discountForm, discountValue: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input type="date" value={discountForm.startDate} onChange={(e) => setDiscountForm({...discountForm, startDate: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input type="date" value={discountForm.endDate} onChange={(e) => setDiscountForm({...discountForm, endDate: e.target.value})} />
              </div>
            </div>

            <Button className="w-full md:w-auto" onClick={handleApplyDiscount}>
              <Plus className="h-4 w-4 mr-2" />
              Apply Discount
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Promotional Codes
            </CardTitle>
            <CardDescription>
              Create custom promo codes for special offers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Promo Code</label>
                <Input
                  placeholder="e.g., SUMMER2026"
                  value={promoCodeData.code}
                  onChange={(e) => setPromoCodeData({ ...promoCodeData, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Discount Type</label>
<Select
                  value={promoCodeData.discountType}
                  onChange={(e) => setPromoCodeData({ ...promoCodeData, discountType: e.target.value as "percentage" | "fixed" })}
                >
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (DT)</SelectItem>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {promoCodeData.discountType === "percentage" ? "Percentage Value" : "Fixed Amount (DT)"}
                </label>
                <div className="relative">
                  {promoCodeData.discountType === "percentage" ? (
                    <Percent className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  ) : (
                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  )}
                  <Input
                    type="number"
                    placeholder={promoCodeData.discountType === "percentage" ? "e.g., 10" : "e.g., 5000"}
                    value={promoCodeData.discountValue}
                    onChange={(e) => setPromoCodeData({ ...promoCodeData, discountValue: e.target.value })}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Minimum Order Value (DT)</label>
                <Input
                  type="number"
                  placeholder="e.g., 10000"
                  value={promoCodeData.minOrderValue}
                  onChange={(e) => setPromoCodeData({ ...promoCodeData, minOrderValue: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Usage Limit</label>
                <Input
                  type="number"
                  placeholder="e.g., 100"
                  value={promoCodeData.usageLimit}
                  onChange={(e) => setPromoCodeData({ ...promoCodeData, usageLimit: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={promoCodeData.startDate}
                  onChange={(e) => setPromoCodeData({ ...promoCodeData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={promoCodeData.endDate}
                  onChange={(e) => setPromoCodeData({ ...promoCodeData, endDate: e.target.value })}
                />
              </div>
            </div>

            <Button onClick={handleCreatePromoCode}>
              <Ticket className="h-4 w-4 mr-2" />
              Generate Promo Code
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Promotions</CardTitle>
            <CardDescription>
              Current and scheduled promotional discounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full">
                  <thead>
                    {promotionsTable.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id} className="border-b bg-muted/50">
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="p-4 text-left align-middle font-medium"
                          >
                            {header.isPlaceholder
                              ? null
                              : typeof header.column.columnDef.header === 'function'
                                ? header.column.columnDef.header(header.getContext())
                                : header.column.columnDef.header}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {promotionsTable.getRowModel().rows?.length ? (
                      promotionsTable.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="border-b transition-colors hover:bg-muted/50">
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="p-4 align-middle">
                              {typeof cell.column.columnDef.cell === 'function'
                                ? cell.column.columnDef.cell(cell.getContext())
                                : cell.column.columnDef.cell}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={promotionColumns().length} className="p-8 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-muted-foreground">No promotions found</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Promo Codes</CardTitle>
            <CardDescription>
              Manage generated promotional codes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter promo codes..."
                  value={(promoCodeFilters.find(f => f.id === "code")?.value as string) || ""}
                  onChange={(e) => setPromoCodeFilters([...promoCodeFilters.filter(f => f.id !== "code"), { id: "code", value: e.target.value }])}
                  className="pl-8"
                />
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full">
                  <thead>
                    {promoCodesTable.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id} className="border-b bg-muted/50">
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="p-4 text-left align-middle font-medium"
                          >
                            {header.isPlaceholder
                              ? null
                              : typeof header.column.columnDef.header === 'function'
                                ? header.column.columnDef.header(header.getContext())
                                : header.column.columnDef.header}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {promoCodesTable.getRowModel().rows?.length ? (
                      promoCodesTable.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="border-b transition-colors hover:bg-muted/50">
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="p-4 align-middle">
                              {typeof cell.column.columnDef.cell === 'function'
                                ? cell.column.columnDef.cell(cell.getContext())
                                : cell.column.columnDef.cell}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={promoCodeColumns().length} className="p-8 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-muted-foreground">No promo codes found</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}