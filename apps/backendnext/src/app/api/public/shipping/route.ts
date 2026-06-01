import { NextRequest, NextResponse } from 'next/server'
import { shippingService } from '@/services/shipping-service'

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:5173', 'http://localhost:3000']

const getCorsHeaders = (request: NextRequest) => {
  const origin = request.headers.get('origin')
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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
  try {
    const providers = await shippingService.getActiveProviders()
    return NextResponse.json({ providers }, { headers: corsHeaders })
  } catch (error: any) {
    console.error('Shipping fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch shipping options' }, { status: 500, headers: corsHeaders })
  }
}