import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

const JWT_SECRET_VALIDATED = JWT_SECRET! as string

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:5173']

const getCorsHeaders = (request: NextRequest) => {
  const origin = request.headers.get('origin')
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400, headers: corsHeaders }
      )
    }

    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401, headers: corsHeaders }
      )
    }

    const user = result.rows[0]
    const isValid = await bcrypt.compare(password, user.password_hash)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401, headers: corsHeaders }
      )
    }

    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    )

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET_VALIDATED,
      { expiresIn: '7d' }
    )

    const { password_hash, ...userWithoutPassword } = user

    const response = NextResponse.json(
      { user: userWithoutPassword, token },
      { status: 200, headers: corsHeaders }
    )
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function GET(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request)
  
  const authHeader = request.headers.get('authorization')
  let token: string | undefined
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }
  
  if (!token) {
    token = request.cookies.get('token')?.value
  }

  if (!token) {
    return NextResponse.json({ user: null }, { status: 200, headers: corsHeaders })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET_VALIDATED) as { userId: string }

    const result = await db.query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ user: null }, { status: 200, headers: corsHeaders })
    }

    const { password_hash, ...user } = result.rows[0]
    return NextResponse.json({ user }, { status: 200, headers: corsHeaders })
  } catch {
    return NextResponse.json({ user: null }, { status: 200, headers: corsHeaders })
  }
}

export async function DELETE(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request)
  const response = NextResponse.json({ success: true }, { headers: corsHeaders })
  response.cookies.delete('token')
  return response
}

export async function PUT(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request)
  
  const authHeader = request.headers.get('authorization')
  let token: string | undefined
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }
  
  if (!token) {
    token = request.cookies.get('token')?.value
  }

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET_VALIDATED) as { userId: string }
    const body = await request.json()
    const { first_name, last_name, email, phone } = body

    const result = await db.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           email = COALESCE($3, email),
           phone = $4
       WHERE id = $5
       RETURNING id, email, first_name, last_name, phone, role`,
      [first_name || null, last_name || null, email || null, phone || null, decoded.userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: corsHeaders })
    }

    const { password_hash, ...user } = result.rows[0]
    return NextResponse.json({ user }, { status: 200, headers: corsHeaders })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500, headers: corsHeaders })
  }
}