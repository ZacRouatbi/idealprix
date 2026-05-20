import { NextRequest, NextResponse } from 'next/server'
import { registerSchema } from '@/lib/schemas/auth-schemas'
import { authService } from '@/services/auth-service'

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:5173']

const getCorsHeaders = (request: NextRequest) => {
  const origin = request.headers.get('origin')
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-csrf-token',
    'Access-Control-Allow-Credentials': 'true',
  }
  
  if (origin && ALLOWED_ORIGINS.some(allowed => allowed === origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  
  return headers
}

const validateOrigin = (request: NextRequest): boolean => {
  const origin = request.headers.get('origin')
  if (!origin) return true

  try {
    const originUrl = new URL(origin)
    const allowed = ALLOWED_ORIGINS.some(allowedOrigin => {
      try {
        const allowedUrl = new URL(allowedOrigin)
        return originUrl.origin === allowedUrl.origin
      } catch {
        return false
      }
    })
    return allowed
  } catch {
    return false
  }
}

export async function OPTIONS(request: NextRequest) {
  const headers = getCorsHeaders(request)
  return new NextResponse(null, { status: 200, headers })
}

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request)
  
  if (!validateOrigin(request)) {
    return NextResponse.json(
      { error: 'Invalid origin' },
      { status: 403, headers: corsHeaders }
    )
  }

  try {
    const body = await request.json()
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400, headers: corsHeaders }
      )
    }

    const { email, password, first_name, last_name } = validation.data

    const { user, token } = await authService.register({
      email,
      password,
      first_name,
      last_name,
      role: 'staff',
    })

    const response = NextResponse.json(
      { user, token },
      { status: 201, headers: corsHeaders }
    )
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error: any) {
    const message = error.message === 'Email already registered' 
      ? 'Email already registered' 
      : 'Registration failed'
    return NextResponse.json(
      { error: message },
      { status: 400, headers: corsHeaders }
    )
  }
}