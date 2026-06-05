"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Calendar } from "lucide-react"
import { SalesChart } from "@/components/sales-chart"
import { OrderStatusChart } from "@/components/order-status-chart"
import { RevenueByCategory } from "@/components/revenue-by-category"
import { MetricsCard } from "@/components/metrics-card"
import { useQuery } from "@tanstack/react-query"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

async function fetchAnalytics() {
  const token = localStorage.getItem('token')
  const headers: HeadersInit = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch("/api/analytics", { headers })
  if (!res.ok) throw new Error("Failed to fetch analytics")
  return res.json()
}

export default function AnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics,
  })

  const handleExport = () => {
    if (!data) return
    
    const doc = new jsPDF()
    doc.setFontSize(20)
    doc.text('Analytics Report', 14, 20)
    doc.setFontSize(12)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)

    autoTable(doc, {
      head: [['Metric', 'Value']],
      body: [
        ['Total Revenue', `${(data.totalRevenue || 0).toLocaleString()} TND`],
        ['Total Orders', (data.totalOrders || 0).toString()],
        ['Avg. Order Value', `${((data.totalRevenue || 0) / (data.totalOrders || 1)).toFixed(2)} TND`],
      ],
      startY: 40,
    })

    if (data.salesByMonth && data.salesByMonth.length > 0) {
      autoTable(doc, {
        head: [['Month', 'Revenue']],
        body: data.salesByMonth.map((row: { name: string; total: number }) => [
          row.name,
          `${row.total.toLocaleString()} TND`,
        ]),
        startY: 60,
      })
    }

    if (data.revenueByCategory && data.revenueByCategory.length > 0) {
      autoTable(doc, {
        head: [['Category', 'Revenue']],
        body: data.revenueByCategory.map((row: { name: string; revenue: number }) => [
          row.name,
          `${row.revenue.toLocaleString()} TND`,
        ]),
        startY: data.salesByMonth?.length > 0 ? 100 : 60,
      })
    }

    doc.save(`Analytics_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8 pt-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="h-24 bg-muted rounded animate-pulse" />
          <div className="h-24 bg-muted rounded animate-pulse" />
          <div className="h-24 bg-muted rounded animate-pulse" />
          <div className="h-24 bg-muted rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8 pt-6">
        <p className="text-destructive text-sm sm:text-base">Failed to load analytics data</p>
      </div>
    )
  }

  const totalRevenue = data?.totalRevenue || 0
  const totalOrders = data?.totalOrders || 0
  const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : "0"

return (
    <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Deep insights into your business performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs sm:text-sm">
            <Calendar className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Last 30 days</span>
            <span className="sm:hidden">30d</span>
          </Button>
          <Button size="sm" onClick={handleExport} className="text-xs sm:text-sm">
            <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Export
          </Button>
        </div>
      </div>
       
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Total Revenue"
          value={`${totalRevenue.toLocaleString('fr-TN')} TND`}
          trend="+12.5%"
          trendDirection="up"
        />
        <MetricsCard
          title="Orders"
          value={totalOrders.toString()}
          trend="+8.2%"
          trendDirection="up"
        />
        <MetricsCard
          title="Conversion Rate"
          value="3.2%"
          trend="+0.4%"
          trendDirection="up"
        />
        <MetricsCard
          title="Avg. Order Value"
          value={`${avgOrderValue} TND`}
          trend="-2.1%"
          trendDirection="down"
        />
      </div>
       
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>
              Monthly sales performance for the current year
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <SalesChart data={data?.salesByMonth} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Current order status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <OrderStatusChart data={data?.orderStatusData} />
          </CardContent>
        </Card>
      </div>
       
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Category</CardTitle>
          <CardDescription>
            Top performing product categories this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueByCategory data={data?.revenueByCategory} />
        </CardContent>
      </Card>
    </div>
  )
}