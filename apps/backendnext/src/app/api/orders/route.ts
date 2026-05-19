import { NextRequest, NextResponse } from 'next/server'
import { orderService } from '@/services/order-service'
import type { OrderStatus } from '@/services/order-service'
import { verifyTokenFromRequest } from '@/lib/auth-middleware'

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

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status') as OrderStatus | null
  
  const filters = {
    limit: parseInt(searchParams.get('limit') || '50'),
    offset: parseInt(searchParams.get('offset') || '0'),
    status: status || undefined,
  }

  try {
    const orders = await orderService.listOrders(filters)
    return NextResponse.json(orders)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}