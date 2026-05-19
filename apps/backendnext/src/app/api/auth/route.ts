import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const JWT_SECRET_VALIDATED = JWT_SECRET! as string

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const user = result.rows[0]
    const isValid = await bcrypt.compare(password, user.password_hash)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
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
      { status: 200 }
    )
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get('token')?.value ||
    request.headers.get('authorization')?.split(' ')[1]

  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET_VALIDATED) as { userId: string }

    const result = await db.query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    const { password_hash, ...user } = result.rows[0]
    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 200 })
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('token')
  return response
}