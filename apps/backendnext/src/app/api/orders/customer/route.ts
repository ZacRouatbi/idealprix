import { NextRequest, NextResponse } from 'next/server'
import { orderService, OrderStatus } from '@/services/order-service'
import { verifyTokenFromRequest } from '@/lib/auth-middleware'

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
  
  const user = await verifyTokenFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
  }

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status') as OrderStatus | null
  
  const filters = {
    limit: parseInt(searchParams.get('limit') || '50'),
    offset: parseInt(searchParams.get('offset') || '0'),
    status: status || undefined,
  }

  try {
    const orders = await orderService.getCustomerOrders(user.email, filters)
    return NextResponse.json(orders, { headers: corsHeaders })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
  }
}