import { NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/services/order-service'
import { verifyTokenFromRequest } from '@/lib/auth-middleware'
import { db } from '@/lib/db'

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
    const orderStats = await orderService.getOrderStats()

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    const salesData = await db.query(`
      SELECT 
        EXTRACT(MONTH FROM created_at) as month,
        SUM(total_amount) as total
      FROM orders 
      WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
      GROUP BY EXTRACT(MONTH FROM created_at)
      ORDER BY month
    `)

    const salesByMonth = salesData.rows.map((row: any) => ({
      name: monthNames[parseInt(row.month) - 1],
      total: parseFloat(row.total),
    }))

    const statusResult = await db.query(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `)

    const orderStatusData = statusResult.rows.map((row: any) => ({
      name: row.status.charAt(0).toUpperCase() + row.status.slice(1),
      value: parseInt(row.count),
    }))

    const categoryRevenue = await db.query(`
      SELECT 
        COALESCE(c.name, 'Uncategorized') as name, 
        SUM(oi.total_price) as revenue
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      GROUP BY c.name
      ORDER BY revenue DESC
    `)

    const revenueByCategory = categoryRevenue.rows.map((row: any) => ({
      name: row.name,
      revenue: parseFloat(row.revenue),
    }))

    return NextResponse.json({
      totalRevenue: Number(orderStats.total_amount),
      totalOrders: orderStats.total,
      salesByMonth,
      orderStatusData,
      revenueByCategory,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}