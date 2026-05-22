import { NextRequest, NextResponse } from 'next/server'
import { shippingService } from '@/services/shipping-service'

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:5173', 'http://localhost:3000']

function addCorsHeaders(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get('origin')
  if (origin && ALLOWED_ORIGINS.some(allowed => allowed === origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return response
}

export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }), request)
}

export async function GET(request: NextRequest) {
  try {
    const providers = await shippingService.getActiveProviders()
    return addCorsHeaders(NextResponse.json({ providers }), request)
  } catch (error: any) {
    console.error('Shipping fetch error:', error)
    return addCorsHeaders(NextResponse.json({ error: 'Failed to fetch shipping options' }, { status: 500 }), request)
  }
}