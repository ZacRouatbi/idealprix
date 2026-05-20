"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { DataTable } from "@/components/data-table"
import { promotionColumns, Promotion } from "@/components/columns/promotion-columns"
import { promoCodeColumns, PromoCode } from "@/components/columns/promo-code-columns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectItem } from "@/components/ui/select"
import { Plus, RefreshCw, Search, Ticket, Calendar as CalendarIcon, Tag, Percent, DollarSign } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useReactTable, getCoreRowModel, getSortedRowModel, SortingState, ColumnFiltersState, getFilteredRowModel } from "@tanstack/react-table"

const mockPromotions: Promotion[] = [
  {
    id: "1",
    targetType: "product",
    targetId: "prod-1",
    targetName: "iPhone 15 Pro",
    discountType: "percentage",
    discountValue: 15,
    startDate: "2026-06-01T00:00:00Z",
    endDate: "2026-06-30T23:59:59Z",
    isActive: true,
  },
  {
    id: "2",
    targetType: "category",
    targetId: "cat-1",
    targetName: "Electronics",
    discountType: "fixed",
    discountValue: 5000,
    startDate: "2026-05-15T00:00:00Z",
    endDate: "2026-05-31T23:59:59Z",
    isActive: true,
  },
  {
    id: "3",
    targetType: "product",
    targetId: "prod-2",
    targetName: "Samsung Galaxy S24",
    discountType: "percentage",
    discountValue: 10,
    startDate: "2026-06-10T00:00:00Z",
    endDate: "2026-07-10T23:59:59Z",
    isActive: false,
  },
]

const mockPromoCodes: PromoCode[] = [
  {
    id: "1",
    code: "SUMMER2026",
    discountType: "percentage",
    discountValue: 15,
    startDate: "2026-06-01T00:00:00Z",
    endDate: "2026-06-30T23:59:59Z",
    minOrderValue: 10000,
    usageLimit: 100,
    usedCount: 23,
    isActive: true,
  },
  {
    id: "2",
    code: "WELCOME5000",
    discountType: "fixed",
    discountValue: 5000,
    startDate: "2026-05-01T00:00:00Z",
    endDate: "2026-05-31T23:59:59Z",
    minOrderValue: 0,
    usageLimit: 50,
    usedCount: 50,
    isActive: false,
  },
]

async function getPromotions(): Promise<Promotion[]> {
  await new Promise(resolve => setTimeout(resolve, 500))
  return mockPromotions
}

async function getPromoCodes(): Promise<PromoCode[]> {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockPromoCodes
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

  const { data: promotions, isLoading: promotionsLoading, error: promotionsError, refetch: refetchPromotions } = useQuery({
    queryKey: ["promotions"],
    queryFn: getPromotions,
  })

  const { data: promoCodes, isLoading: promoCodesLoading, error: promoCodesError } = useQuery({
    queryKey: ["promo-codes"],
    queryFn: getPromoCodes,
  })

  const handleDeletePromotion = async (promotion: Promotion) => {
    if (!confirm("Are you sure you want to delete this promotion?")) return
    queryClient.setQueryData(["promotions"], (old: Promotion[] | undefined) =>
      old?.filter(p => p.id !== promotion.id)
    )
  }

  const handleCreatePromoCode = async () => {
    if (!promoCodeData.code || !promoCodeData.discountValue || !promoCodeData.startDate || !promoCodeData.endDate) {
      alert("Please fill in all required fields")
      return
    }
    
    const newPromoCode: PromoCode = {
      id: Date.now().toString(),
      code: promoCodeData.code,
      discountType: promoCodeData.discountType,
      discountValue: parseFloat(promoCodeData.discountValue),
      startDate: new Date(promoCodeData.startDate).toISOString(),
      endDate: new Date(promoCodeData.endDate).toISOString(),
      minOrderValue: promoCodeData.minOrderValue ? parseFloat(promoCodeData.minOrderValue) : 0,
      usageLimit: promoCodeData.usageLimit ? parseInt(promoCodeData.usageLimit) : undefined,
      usedCount: 0,
      isActive: true,
    }
    
    queryClient.setQueryData(["promo-codes"], (old: PromoCode[] | undefined) => [...(old || []), newPromoCode])
    alert(`Promo code ${promoCodeData.code} created successfully!`)
    setPromoCodeData({
      code: "",
      discountType: "percentage",
      discountValue: "",
      minOrderValue: "",
      startDate: "",
      endDate: "",
      usageLimit: "",
    })
  }

  const handleApplyDiscount = async () => {
    alert("Discount applied successfully!")
  }

  const promotionsTable = useReactTable({
    data: promotions || [],
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
    data: promoCodes || [],
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
                <Select defaultValue="product">
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Product/Category</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Discount Type</label>
                <Select defaultValue="percentage">
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
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input type="date" />
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
                  defaultValue={promoCodeData.discountType}
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