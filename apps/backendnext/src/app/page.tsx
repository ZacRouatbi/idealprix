import { MetricsCard } from "@/components/metrics-card"
import { Button } from "@/components/ui/button"
import { Download, Calendar } from "lucide-react"
import { orderService } from "@/services/order-service"
import { productService } from "@/services/product-service"
import { auditService } from "@/services/audit-service"
import { inventoryService } from "@/services/inventory-service"
import { db } from "@/lib/db"
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

function calculateTrend(current: number, previous: number): { trend: string; direction: 'up' | 'down' } {
  if (previous === 0) return { trend: '0%', direction: 'up' }
  const percentage = ((current - previous) / previous) * 100
  return {
    trend: `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`,
    direction: percentage >= 0 ? 'up' : 'down'
  }
}

async function getDashboardData() {
  try {
    const now = new Date()
    const currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const [orderStats, productCount, lowStockItems, recentOrders, recentActivities, previousOrderStats, previousProductCount, previousLowStockCount] = await Promise.all([
      orderService.getOrderStats(),
      productService.getProductCount(),
      inventoryService.getLowStockItems(),
      orderService.getRecentOrders(5),
      auditService.getRecentActivities(8),
      db.query('SELECT COUNT(*) as total, COALESCE(SUM(total_amount), 0) as total_amount FROM orders WHERE created_at >= $1 AND created_at < $2', [previousPeriodStart.toISOString(), currentPeriodStart.toISOString()]),
      db.query('SELECT COUNT(*) FROM products WHERE created_at < $1', [currentPeriodStart.toISOString()]),
      db.query('SELECT COUNT(*) FROM inventory i JOIN products p ON i.product_id = p.id WHERE (i.quantity - i.reserved_quantity) < COALESCE(p.low_stock_threshold, 10) AND p.created_at < $1', [currentPeriodStart.toISOString()]),
    ])

    const prevOrderRow = previousOrderStats.rows[0] || { total: 0, total_amount: 0 }
    const prevProductRow = previousProductCount.rows[0] || { count: 0 }
    const prevLowStockRow = previousLowStockCount.rows[0] || { count: 0 }

    const previousTotal = parseInt(prevOrderRow.total) || 0
    const previousAmount = parseFloat(prevOrderRow.total_amount) || 0
    const currentTrend = calculateTrend(orderStats.total_amount, previousAmount)
    const productTrend = calculateTrend(productCount, parseInt(prevProductRow.count) || 0)
    const lowStockTrend = calculateTrend(lowStockItems.length, parseInt(prevLowStockRow.count) || 0)

    return {
      totalOrders: orderStats.total,
      totalRevenue: orderStats.total_amount,
      orderTrend: currentTrend.trend,
      orderTrendDirection: currentTrend.direction,
      totalProducts: productCount,
      productTrend: productTrend.trend,
      productTrendDirection: productTrend.direction,
      lowStockCount: lowStockItems.length,
      lowStockTrend: lowStockTrend.trend,
      lowStockTrendDirection: lowStockTrend.direction,
      recentOrders,
      recentActivities,
    }
  } catch (error) {
    console.error("Dashboard data fetch error:", error)
    return {
      totalOrders: 0,
      totalRevenue: 0,
      orderTrend: '+0%',
      orderTrendDirection: 'up' as const,
      totalProducts: 0,
      productTrend: '+0%',
      productTrendDirection: 'up' as const,
      lowStockCount: 0,
      lowStockTrend: '+0%',
      lowStockTrendDirection: 'up' as const,
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
          trend={data.orderTrend}
          trendDirection={data.orderTrendDirection}
        />
        <MetricsCard
          title="Orders"
          value={data.totalOrders.toString()}
          trend={data.orderTrend}
          trendDirection={data.orderTrendDirection}
        />
        <MetricsCard
          title="Products"
          value={data.totalProducts.toString()}
          trend={data.productTrend}
          trendDirection={data.productTrendDirection}
        />
        <MetricsCard
          title="Low Stock"
          value={data.lowStockCount.toString()}
          trend={data.lowStockTrend}
          trendDirection={data.lowStockTrendDirection === 'up' ? 'down' : 'up'}
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 p-8">
        <RecentOrders orders={data.recentOrders} />
        <RecentActivity activities={data.recentActivities} />
      </div>
    </>
  )
}