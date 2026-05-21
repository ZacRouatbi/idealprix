import { NextRequest, NextResponse } from 'next/server'
import { promotionService } from '@/services/promotion-service'
import { rateLimit } from '@/lib/validation'

const publicRateLimit = rateLimit({
  windowMs: 60000,
  maxRequests: 120,
})

function addCorsHeaders(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get('origin') || '*'
  response.headers.set('Access-Control-Allow-Origin', origin)
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }), request)
}

export async function GET(request: NextRequest) {
  const rateLimitResponse = await publicRateLimit(request)
  if (rateLimitResponse) return addCorsHeaders(rateLimitResponse, request)

  try {
    const now = new Date()
    const nowISO = now.toISOString()
    
    const promotions = await promotionService.listPromotions({
      limit: 200,
      isActive: true,
    })
    
    // Filter to only currently running promotions (string comparison works for ISO dates)
    const activePromotions = promotions.data.filter(p => {
      // Handle both ISO string and Date object formats
      const start = typeof p.startDate === 'string' ? p.startDate : new Date(p.startDate).toISOString()
      const end = typeof p.endDate === 'string' ? p.endDate : new Date(p.endDate).toISOString()
      return start <= nowISO && end >= nowISO
    })

    return addCorsHeaders(NextResponse.json({
      data: activePromotions.map(p => ({
        id: p.id,
        targetType: p.targetType,
        targetId: p.targetId,
        discountType: p.discountType,
        discountValue: p.discountValue,
        startDate: p.startDate,
        endDate: p.endDate,
      })),
      count: activePromotions.length,
      limit: 200,
      offset: 0,
      page: 1,
      totalPages: 1,
    }), request)
  } catch (error: any) {
    return addCorsHeaders(NextResponse.json({ error: error.message }, { status: 500 }), request)
  }
}