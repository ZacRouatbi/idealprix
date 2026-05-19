import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/validation'

const globalRateLimit = rateLimit({
  windowMs: 60000,
  maxRequests: 200,
})

export async function middleware(request: NextRequest) {
  const rateLimitResponse = await globalRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.split(' ')[1]

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || 
                      request.nextUrl.pathname.startsWith('/api/auth') ||
                      request.nextUrl.pathname.startsWith('/api/public')

  if (isAuthRoute) {
    if (token) {
      try {
        const response = await fetch(`${request.nextUrl.origin}/api/auth`, {
          headers: { authorization: `Bearer ${token}` }
        })
        const data = await response.json()
        if (data.user && request.nextUrl.pathname.startsWith('/login')) {
          return NextResponse.redirect(new URL('/', request.url))
        }
      } catch (e) {
        // Continue to auth route
      }
    }
    return NextResponse.next()
  }

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', request.url)
    return NextResponse.redirect(loginUrl)
  }

  try {
    const response = await fetch(`${request.nextUrl.origin}/api/auth`, {
      headers: { authorization: `Bearer ${token}` }
    })
    const data = await response.json()
    
    if (!data.user) {
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  } catch (e) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  const response = NextResponse.next()
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  return response
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|api/public).*)'],
}