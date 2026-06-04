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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkAuth(request)
  if (authError) return authError

  const { id } = await params
  try {
    const promoCode = await promotionService.getPromoCode(id)
    if (!promoCode) {
      return NextResponse.json({ error: 'Promo code not found' }, { status: 404 })
    }
    
    // Get accurate usage count from usage table
    const usageCount = await promotionService.getPromoCodeUsageCount(id)
    const promoCodeWithUsage = { ...promoCode, usedCount: usageCount }
    
    return NextResponse.json(promoCodeWithUsage)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkAuth(request)
  if (authError) return authError

  const { id } = await params
  try {
    const data = await request.json()
    const promoCode = await promotionService.updatePromoCode(id, data)
    return NextResponse.json(promoCode)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkAuth(request)
  if (authError) return authError

  const { id } = await params
  try {
    await promotionService.deletePromoCode(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
