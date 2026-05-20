import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from './db'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

const JWT_SECRET_VALIDATED = JWT_SECRET as string

export async function verifyTokenFromRequest(request: NextRequest) {
  const token = request.cookies.get('token')?.value ||
    request.headers.get('authorization')?.split(' ')[1]

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET_VALIDATED) as { userId: string; email: string; role: string }

    const result = await db.query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    )

    if (result.rows.length === 0) {
      return null
    }

    const { password_hash, ...user } = result.rows[0]
    return user as any
  } catch {
    return null
  }
}
