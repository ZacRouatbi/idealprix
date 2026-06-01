import { MetricsCard } from "@/components/metrics-card"
import { Button } from "@/components/ui/button"
import { Download, Calendar } from "lucide-react"
import { orderService } from "@/services/order-service"
import { productService } from "@/services/product-service"
import { auditService } from "@/services/audit-service"
import { RecentOrders } from "@/components/recent-orders"
import { RecentActivity } from "@/components/recent-activity"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

async function verifyAuth(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return false
  
  try {
    const jwt = require('jsonwebtoken')
    const JWT_SECRET = process.env.JWT_SECRET
    if (!JWT_SECRET) return false
    jwt.verify(token, JWT_SECRET)
    return true
  } catch {
    return false
  }
}

async function getDashboardData() {
  try {
    const [orderStats, productStats, recentOrders, recentActivities] = await Promise.all([
      orderService.getOrderStats(),
      productService.listProducts({ limit: 1 }),
      orderService.getRecentOrders(5),
      auditService.getRecentActivities(8),
    ])

    return {
      totalOrders: orderStats.total,
      totalRevenue: orderStats.total_amount,
      totalProducts: productStats.count,
      recentOrders,
      recentActivities,
    }
  } catch (error) {
    console.error("Dashboard data fetch error:", error)
    return {
      totalOrders: 0,
      totalRevenue: 0,
      totalProducts: 0,
      recentOrders: [],
      recentActivities: [],
    }
  }
}

export default async function DashboardPage() {
  const isAuthenticated = await verifyAuth()

  if (!isAuthenticated) {
    redirect('/login')
  }

  const data = await getDashboardData()

  return (
    <>
      <div className="w-full max-w-full mb-6">
        <img
          src="/IdealBanner.png"
          alt="Ideal Prix Banner"
          className="w-full h-full object-cover scale-100"
        />
      </div>
      
      <div className="flex-1 space-y-6 px-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Welcome back! Here's your business overview.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Last 30 days
            </Button>
            <Button asChild>
              <a href="/api/dashboard/export" download>
                <Download className="mr-2 h-4 w-4" />
                Export
              </a>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 p-8">
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
          title="Products"
          value={data.totalProducts.toString()}
          trend="+3.1%"
          trendDirection="down"
        />
        <MetricsCard
          title="Low Stock"
          value="23"
          trend="-2.5%"
          trendDirection="up"
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 p-8">
        <RecentOrders orders={data.recentOrders} />
        <RecentActivity activities={data.recentActivities} />
      </div>
    </>
  )
}