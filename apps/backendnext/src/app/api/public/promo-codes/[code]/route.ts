import { NextRequest, NextResponse } from 'next/server'
import { promotionService } from '@/services/promotion-service'
import { rateLimit } from '@/lib/validation'
import { db } from '@/lib/db'

const publicRateLimit = rateLimit({
  windowMs: 60000,
  maxRequests: 60,
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

function addCorsHeaders(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get('origin')
  if (origin && ALLOWED_ORIGINS.some(allowed => allowed === origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

export async function OPTIONS(request: NextRequest) {
  const headers = getCorsHeaders(request)
  return new NextResponse(null, { status: 200, headers })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const corsHeaders = getCorsHeaders(request)
  const rateLimitResponse = await publicRateLimit(request)
  if (rateLimitResponse) return addCorsHeaders(rateLimitResponse, request)

  try {
    const searchParams = request.nextUrl.searchParams
    const { code } = await params
    const userId = searchParams.get('userId')
    
    // For logged-in users, check if they already used this promo code
    const promoCode = userId 
      ? await promotionService.getPromoCodeByCodeForUser(code, userId)
      : await promotionService.getPromoCodeByCode(code)
    
    if (!promoCode) {
      // Check if code exists but user already used it
      if (userId) {
        const codeExists = await promotionService.getPromoCodeByCode(code)
        if (codeExists) {
          const userUsed = await db.query(
            'SELECT 1 FROM promo_code_usage WHERE promo_code_id = $1 AND user_id = $2',
            [codeExists.id, userId]
          )
          if (userUsed.rows.length > 0) {
            return NextResponse.json({ valid: false, error: 'Already used by this account' }, { status: 400, headers: corsHeaders })
          }
        }
      }
      return NextResponse.json({ valid: false, error: 'Invalid or expired promo code' }, { status: 404, headers: corsHeaders })
    }

    return NextResponse.json({
      valid: true,
      promoCode: {
        code: promoCode.code,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        minOrderValue: promoCode.minOrderValue,
      }
    }, { headers: corsHeaders })
  } catch (error: any) {
    return NextResponse.json({ valid: false, error: error.message }, { status: 500, headers: corsHeaders })
  }
}