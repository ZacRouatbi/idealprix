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
      search: searchParams.get('search') || undefined,
      isActive: searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined,
    }

    const promoCodes = await promotionService.listPromoCodes(filters)
    return NextResponse.json(promoCodes)
  } catch (error: any) {
    console.error('Promo codes error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = await checkAuth(request)
  if (authError) return authError

  try {
    const data = await request.json()

    if (!data.code || !data.discountValue || !data.startDate || !data.endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const promoCode = await promotionService.createPromoCode({
      code: data.code,
      discountType: data.discountType || 'percentage',
      discountValue: data.discountValue,
      startDate: data.startDate,
      endDate: data.endDate,
      minOrderValue: data.minOrderValue || 0,
      usageLimit: data.usageLimit,
      isActive: data.isActive ?? true,
    })

    return NextResponse.json(promoCode, { status: 201 })
  } catch (error: any) {
    console.error('Create promo code error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
