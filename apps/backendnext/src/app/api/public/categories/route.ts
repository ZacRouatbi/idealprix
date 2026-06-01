import { NextRequest, NextResponse } from 'next/server'
import { categoryService } from '@/services/category-service'
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
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '100')), 200)
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))
  
  const filters = {
    limit,
    offset,
    search: searchParams.get('search') || undefined,
    parent_id: searchParams.get('parent_id') || undefined,
    is_active: true,
  }

  try {
    const result = await categoryService.listCategories(filters)
    
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
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
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