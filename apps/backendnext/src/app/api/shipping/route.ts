import { NextRequest, NextResponse } from 'next/server'
import { shippingService } from '@/services/shipping-service'
import { verifyTokenFromRequest } from '@/lib/auth-middleware'

async function checkAuth(request: NextRequest) {
  const user = await verifyTokenFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!['admin', 'manager'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function GET(request: NextRequest) {
  const authError = await checkAuth(request)
  if (authError) return authError

  try {
    const result = await (await import('@/lib/db')).db.query(
      'SELECT id, name, phone, price, service_type, is_active, created_at FROM shipping_providers ORDER BY is_active DESC, price ASC',
      []
    )
    return NextResponse.json({ data: result.rows })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth(request)
  if (authError) return authError

  try {
    const { name, phone, price, service_type } = await request.json()
    
    const result = await (await import('@/lib/db')).db.query(
      'INSERT INTO shipping_providers (id, name, phone, price, service_type) VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING *',
      [name, phone || null, price, service_type]
    )
    
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}