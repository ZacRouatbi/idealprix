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

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authError = await checkAuth(request)
  if (authError) return authError

  try {
    const { id } = await context.params
    const order = await orderService.getOrder(id)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    return NextResponse.json(order)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authError = await checkAuth(request)
  if (authError) return authError

  try {
    const { id } = await context.params
    const { status } = await request.json()
    
    // Get current order status to check if we need to update inventory
    const currentOrder = await db.query('SELECT * FROM orders WHERE id = $1', [id])
    const oldStatus = currentOrder.rows[0]?.status
    
    // Update order status
    const order = await orderService.updateOrderStatus(id, status)
    
    // Release reserved inventory when order is shipped, delivered, or cancelled
    if (oldStatus && ['pending', 'processing', 'paid'].includes(oldStatus) && 
        ['shipped', 'delivered', 'cancelled'].includes(status)) {
      const items = await db.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [id])
      for (const item of items.rows) {
        await db.query(
          'UPDATE inventory SET reserved_quantity = GREATEST(0, reserved_quantity - $1) WHERE product_id = $2',
          [item.quantity, item.product_id]
        )
      }
    }
    
    return NextResponse.json(order)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}