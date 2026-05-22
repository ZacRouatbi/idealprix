import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const CSRF_TOKEN_LENGTH = 32

export function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

export function validateCSRFToken(request: NextRequest): { valid: boolean; token?: string } {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  
  // Allow same-origin requests
  if (origin && host) {
    try {
      const originUrl = new URL(origin)
      if (originUrl.host === host) {
        return { valid: true }
      }
    } catch {
      // Invalid origin URL, continue with header check
    }
  }

  // Check for CSRF token in header
  const csrfToken = request.headers.get('x-csrf-token')
  const cookieToken = request.cookies.get('csrf_token')?.value

  if (csrfToken && cookieToken && csrfToken === cookieToken) {
    return { valid: true, token: csrfToken }
  }

  return { valid: false }
}

export function setCSRFCookie(response: NextResponse, token: string): void {
  response.cookies.set('csrf_token', token, {
    httpOnly: false, // Must be accessible to JS for header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
}

// CSRF middleware wrapper
export function withCSRFProtection(
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse,
  methods: string[] = ['POST', 'PUT', 'PATCH', 'DELETE']
) {
  return async (request: NextRequest) => {
    // Skip GET and HEAD requests
    if (request.method === 'GET' || request.method === 'HEAD') {
      return handler(request)
    }

    const csrfResult = validateCSRFToken(request)
    if (!csrfResult.valid) {
      return NextResponse.json(
        { error: 'CSRF token validation failed' },
        { status: 403 }
      )
    }

    return handler(request)
  }
}