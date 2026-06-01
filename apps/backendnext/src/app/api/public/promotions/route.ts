import { NextRequest, NextResponse } from 'next/server'
import { promotionService } from '@/services/promotion-service'
import { rateLimit } from '@/lib/validation'

const publicRateLimit = rateLimit({
  windowMs: 60000,
  maxRequests: 120,
})

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:5173', 'http://localhost:3000']

const getCorsHeaders = (request: NextRequest) => {
  const origin = request.headers.get('origin')
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
  
  if (origin && ALLOWED_ORIGINS.some(allowed => allowed === origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  
  return headers
}

export async function OPTIONS(request: NextRequest) {
  const headers = getCorsHeaders(request)
  return new NextResponse(null, { status: 200, headers })
}

export async function GET(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request)
  const rateLimitResponse = await publicRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

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

    return NextResponse.json({
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
    }, { headers: corsHeaders })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
  }
}