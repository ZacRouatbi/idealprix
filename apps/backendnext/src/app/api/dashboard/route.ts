import { NextRequest, NextResponse } from 'next/server'
import { verifyTokenFromRequest } from '@/lib/auth-middleware'
import { orderService } from '@/services/order-service'
import { productService } from '@/services/product-service'
import { inventoryService } from '@/services/inventory-service'

async function checkAuth(request: NextRequest) {
  const user = await verifyTokenFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!['admin', 'manager', 'staff'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function GET(request: NextRequest) {
  const authError = await checkAuth(request)
  if (authError) return authError

  try {
    const [orderStats, productCount, lowStockItems] = await Promise.all([
      orderService.getOrderStats(),
      productService.getProductCount(),
      inventoryService.getLowStockItems(),
    ])

    const csvContent = `Metric,Value
Total Revenue,${orderStats.total_amount.toLocaleString('fr-TN')} TND
Total Orders,${orderStats.total}
Total Products,${productCount}
Low Stock Items,${lowStockItems.length}`

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="dashboard-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}