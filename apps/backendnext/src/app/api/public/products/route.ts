import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services/product-service'
import { rateLimit } from '@/lib/validation'
import { buildPaginationLinks } from '@/lib/pagination'

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

  const searchParams = request.nextUrl.searchParams
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '50')), 200)
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))
  
  const categoryIds = searchParams.get('category_id') || undefined
  const filters: any = {
    limit,
    offset,
    search: searchParams.get('search') || undefined,
    is_active: true,
    category_id: categoryIds ? categoryIds.split(',') : undefined,
  }
  
  const slug = searchParams.get('slug')
  if (slug) {
    const product = await productService.getProductBySlug(slug)
    if (product) {
      return NextResponse.json({
        data: [product],
        count: 1,
        limit: 1,
        offset: 0,
        page: 1,
        totalPages: 1,
      }, { headers: corsHeaders })
    }
    return NextResponse.json({ data: [], count: 0 }, { headers: corsHeaders })
  }
  
  try {
    const result = await productService.listProducts(filters)
    
    const baseUrl = request.nextUrl.pathname
    const paginationLinks = buildPaginationLinks(baseUrl, {
      page: result.page,
      totalPages: result.totalPages,
      limit: result.limit,
      offset: result.offset
    })
    
    return NextResponse.json(
      {
        ...result,
        links: paginationLinks,
      },
      {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Total-Count': result.count.toString(),
          'X-Page': result.page.toString(),
          'X-Total-Pages': result.totalPages.toString(),
        },
      }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
  }
}