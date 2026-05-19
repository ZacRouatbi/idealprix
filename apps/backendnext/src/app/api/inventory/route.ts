import { NextRequest, NextResponse } from 'next/server'
import { inventoryService } from '@/services/inventory-service'
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

  try {
    const searchParams = request.nextUrl.searchParams
    const filters = {
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
      low_stock: searchParams.get('low_stock') === 'true',
      product_id: searchParams.get('product_id') || undefined,
    }

    const inventory = await inventoryService.listInventory(filters)
    return NextResponse.json(inventory)
  } catch (error) {
    console.error('Inventory error:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const authError = await checkAuth(request)
  if (authError) return authError

  try {
    const { product_id, quantity } = await request.json()
    const item = await inventoryService.adjustInventory(product_id, quantity)
    return NextResponse.json(item)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}