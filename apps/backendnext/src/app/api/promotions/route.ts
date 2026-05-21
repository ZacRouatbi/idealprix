import { NextRequest, NextResponse } from 'next/server'
import { promotionService } from '@/services/promotion-service'
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
    const filters: any = {
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
      targetType: searchParams.get('target_type') || undefined,
      isActive: searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined,
      search: searchParams.get('search') || undefined,
    }

    const promotions = await promotionService.listPromotions(filters)
    return NextResponse.json(promotions)
  } catch (error: any) {
    console.error('Promotions error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth(request)
  if (authError) return authError

  try {
    const data = await request.json()

    if (!data.targetId || !data.discountValue || !data.startDate || !data.endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const promotion = await promotionService.createPromotion({
      targetType: data.targetType || 'product',
      targetId: data.targetId,
      targetName: data.targetName || '',
      discountType: data.discountType || 'percentage',
      discountValue: data.discountValue,
      startDate: data.startDate,
      endDate: data.endDate,
      isActive: data.isActive ?? true,
    })

    return NextResponse.json(promotion, { status: 201 })
  } catch (error: any) {
    console.error('Create promotion error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
