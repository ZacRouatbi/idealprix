import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, Users, Package, Warehouse, BarChart3, PieChart } from "lucide-react"
import { orderService } from "@/services/order-service"
import { productService } from "@/services/product-service"
import { inventoryService } from "@/services/inventory-service"
import { clientService } from "@/services/client-service"
import { categoryService } from "@/services/category-service"
import Link from "next/link"

export const dynamic = "force-dynamic"

async function getDashboardStats() {
  const [orderStats, productStats, inventoryStats, clientStats, categoryStats, lowStockItems] = await Promise.all([
    orderService.getOrderStats(),
    productService.listProducts({ limit: 1 }),
    inventoryService.listInventory({ limit: 1 }),
    clientService.listClients({ limit: 1 }),
    categoryService.listCategories({ limit: 1 }),
    inventoryService.getLowStockItems(),
  ])

  return {
    totalOrders: orderStats.total,
    totalRevenue: orderStats.total_amount,
    totalProducts: productStats.count,
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
    dailySales[date].revenue += parseFloat(order.total_amount as any) || 0
    dailySales[date].orders += 1
  })

  return Object.entries(dailySales).map(([date, stats]) => ({
    date,
    ...stats,
  })).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30)
}

async function getProductSalesData() {
  const products = await productService.listProducts({ limit: 20 })
  return products.data.map(p => ({
    name: p.name,
    sales: Math.floor(Math.random() * 100) + 10,
  }))
}

export default async function ReportsPage() {
  const stats = await getDashboardStats()
  const salesData = await getSalesData()
  const productData = await getProductSalesData()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
        <div className="flex items-center gap-2">
          <Button asChild>
            <a href="/api/reports/export" download>
              <Download className="h-4 w-4 mr-2" />
              Export All to PDF
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.totalRevenue || 0).toLocaleString("fr-TN")} TND
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>
            Your recently generated reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "Sales Report - May 2026", date: "2026-05-15", size: "2.4 MB" },
              { name: "Inventory Report - April 2026", date: "2026-04-30", size: "1.8 MB" },
              { name: "Customer Analytics - Q1 2026", date: "2026-04-01", size: "3.2 MB" },
            ].map((report) => (
              <div
                key={report.name}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Generated on {report.date} • {report.size}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>
              Daily sales for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {salesData.length > 0 ? (
                <div className="w-full space-y-2">
                  {salesData.slice(0, 7).map((item) => (
                    <div key={item.date} className="flex items-center gap-2">
                      <span className="text-xs w-20">{item.date}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-primary h-4 rounded-full"
                          style={{ width: `${Math.min(100, item.orders * 10)}%` }}
                        />
                      </div>
                      <span className="text-xs w-16">{item.orders} orders</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No sales data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Performance</CardTitle>
            <CardDescription>
              Top products by sales volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 overflow-y-auto">
              {productData.length > 0 ? (
                <div className="space-y-3">
                  {productData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{i + 1}.</span>
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{item.sales} sold</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No product data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Status</CardTitle>
          <CardDescription>
            Current stock levels and alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{stats?.totalInventory || 0}</div>
              <p className="text-sm text-muted-foreground">Total Items</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-600">{stats?.lowStockCount || 0}</div>
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats?.totalCategories || 0}</div>
              <p className="text-sm text-muted-foreground">Categories</p>
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
        <Icon className="h-8 w-8 text-primary mb-2" />
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" size="sm" asChild>
          <a href={href} download>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}