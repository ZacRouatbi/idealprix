import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, Users, Package, Warehouse, BarChart3, PieChart } from "lucide-react"
import { orderService } from "@/services/order-service"
import { productService } from "@/services/product-service"
import { inventoryService } from "@/services/inventory-service"
import { clientService } from "@/services/client-service"
import { categoryService } from "@/services/category-service"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

async function getDashboardStats() {
  const [orderStats, productCount, inventoryStats, clientStats, categoryStats, lowStockItems] = await Promise.all([
    orderService.getOrderStats(),
    productService.getProductCount(),
    inventoryService.listInventory({ limit: 1 }),
    clientService.listClients({ limit: 1 }),
    categoryService.listCategories({ limit: 1 }),
    inventoryService.getLowStockItems(),
  ])

  return {
    totalOrders: orderStats.total,
    totalRevenue: Number(orderStats.total_amount),
    totalProducts: productCount,
    totalInventory: inventoryStats.count,
    totalCustomers: clientStats.count,
    totalCategories: categoryStats.count,
    lowStockCount: lowStockItems.length,
  }
}

async function getSalesData() {
  const orders = await orderService.listOrders({ limit: 100 })
  const data = orders.data || []

  const dailySales: Record<string, { revenue: number; orders: number }> = {}
  
  data.forEach(order => {
    const date = new Date(order.created_at).toISOString().split("T")[0]
    if (!dailySales[date]) {
      dailySales[date] = { revenue: 0, orders: 0 }
    }
    dailySales[date].revenue += Number(order.total_amount) || 0
    dailySales[date].orders += 1
  })

  return Object.entries(dailySales).map(([date, stats]) => ({
    date,
    ...stats,
  })).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30)
}

async function getProductSalesData() {
  const result = await db.query(`
    SELECT p.name, SUM(oi.quantity) as total_sold
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    GROUP BY p.name
    ORDER BY total_sold DESC
    LIMIT 20
  `)

  return result.rows.map((row: any) => ({
    name: row.name,
    sales: parseInt(row.total_sold),
  }))
}

export default async function ReportsPage() {
  const stats = await getDashboardStats()
  const salesData = await getSalesData()
  const productData = await getProductSalesData()

  return (
    <div className="flex-1 space-y-4 px-4 sm:px-6 lg:px-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Reports</h2>
        <Button size="sm" asChild>
          <a href="/api/reports/export" download>
            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Export All
          </a>
        </Button>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Revenue</CardTitle>
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {(stats?.totalRevenue || 0).toLocaleString("fr-TN")} TND
            </div>
            <p className="text-xs text-muted-foreground">
              From {stats?.totalOrders || 0} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats?.totalOrders || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Products</CardTitle>
            <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats?.totalProducts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats?.totalCustomers || 0}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ReportCard
          title="Sales Report"
          description="View and analyze your sales performance"
          icon={FileText}
          href="/api/reports/sales"
        />

        <ReportCard
          title="Customer Report"
          description="Customer analytics and insights"
          icon={Users}
          href="/api/reports/customers"
        />

        <ReportCard
          title="Product Report"
          description="Product performance analysis"
          icon={Package}
          href="/api/reports/products"
        />

        <ReportCard
          title="Inventory Report"
          description="Stock levels and inventory analytics"
          icon={Warehouse}
          href="/api/reports/inventory"
        />

        <ReportCard
          title="Financial Report"
          description="Financial performance and profit analysis"
          icon={BarChart3}
          href="/api/reports/financial"
        />

        <ReportCard
          title="Category Report"
          description="Sales breakdown by category"
          icon={PieChart}
          href="/api/reports/categories"
        />
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Sales Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-64">
              {salesData.length > 0 ? (
                <div className="w-full space-y-2">
                  {salesData.slice(0, 7).map((item) => (
                    <div key={item.date} className="flex items-center gap-2">
                      <span className="text-xs w-20">{item.date}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-3 sm:h-4">
                        <div 
                          className="bg-primary h-3 sm:h-4 rounded-full"
                          style={{ width: `${Math.min(100, item.orders * 10)}%` }}
                        />
                      </div>
                      <span className="text-xs w-12 sm:w-16">{item.orders}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs sm:text-sm">No sales data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Product Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 sm:h-64 overflow-y-auto">
              {productData.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {productData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-medium">{i + 1}.</span>
                        <span className="text-xs sm:text-sm">{item.name}</span>
                      </div>
                      <span className="text-xs sm:text-sm text-muted-foreground">{item.sales} sold</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs sm:text-sm">No product data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Inventory Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-muted rounded-lg">
              <div className="text-xl sm:text-2xl font-bold">{stats?.totalInventory || 0}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Total Items</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-amber-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-amber-600">{stats?.lowStockCount || 0}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Low Stock Items</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{stats?.totalCategories || 0}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">Categories</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ReportCard({ 
  title, 
  description, 
  icon: Icon,
  href 
}: { 
  title: string
  description: string
  icon: any
  href: string
}) {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
      <CardHeader>
        <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2" />
        <CardTitle className="text-sm sm:text-base">{title}</CardTitle>
        <CardDescription className="text-xs">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm">
          <a href={href} download>
            <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Export
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}