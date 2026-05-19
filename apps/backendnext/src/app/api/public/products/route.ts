import { NextRequest, NextResponse } from 'next/server'
import { productService } from '@/services/product-service'
import { rateLimit } from '@/lib/validation'
import { buildPaginationLinks } from '@/lib/pagination'

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

  const searchParams = request.nextUrl.searchParams
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '50')), 100)
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))
  
  const categoryIds = searchParams.get('category_id') || undefined
  const filters: any = {
    limit,
    offset,
    search: searchParams.get('search') || undefined,
    category_id: categoryIds,
    is_active: true,
  }
  
  const slug = searchParams.get('slug')
  if (slug) {
    const product = await productService.getProductBySlug(slug)
    if (product) {
      return addCorsHeaders(NextResponse.json({
        data: [product],
        count: 1,
        limit: 1,
        offset: 0,
        page: 1,
        totalPages: 1,
      }), request)
    }
    return addCorsHeaders(NextResponse.json({ data: [], count: 0 }), request)
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
    
    return addCorsHeaders(NextResponse.json(
      {
        ...result,
        links: paginationLinks,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'X-Total-Count': result.count.toString(),
          'X-Page': result.page.toString(),
          'X-Total-Pages': result.totalPages.toString(),
        },
      }
    ), request)
  } catch (error: any) {
    return addCorsHeaders(NextResponse.json({ error: error.message }, { status: 500 }), request)
  }
}