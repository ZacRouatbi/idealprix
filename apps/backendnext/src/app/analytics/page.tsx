import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricsCard } from "@/components/metrics-card"
import { Button } from "@/components/ui/button"
import { Download, Calendar } from "lucide-react"
import { orderService } from "@/services/order-service"

export const dynamic = 'force-dynamic'

async function getAnalyticsData() {
  const orderStats = await orderService.getOrderStats()
  return {
    totalRevenue: orderStats.total_amount,
    totalOrders: orderStats.total,
  }
}

export default async function AnalyticsPage() {
  const data = await getAnalyticsData()

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Deep insights into your business performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Last 30 days
          </Button>
          <Button asChild>
            <a href="/api/analytics/export" download>
              <Download className="mr-2 h-4 w-4" />
              Export
            </a>
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title="Total Revenue"
          value={`${data.totalRevenue.toLocaleString('fr-TN')} TND`}
          trend="+12.5%"
          trendDirection="up"
        />
        <MetricsCard
          title="Orders"
          value={data.totalOrders.toString()}
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
          value="101.56 TND"
          trend="-2.1%"
          trendDirection="down"
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>
              Monthly sales performance for the current year
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-64 bg-muted rounded" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            <CardDescription>Current order status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded" />
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
          <div className="h-64 bg-muted rounded" />
        </CardContent>
      </Card>
    </div>
  )
}