import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const JWT_SECRET_VALIDATED = JWT_SECRET! as string

export interface AuthenticatedUser {
  id: string
  email: string
  role: 'admin' | 'manager' | 'staff' | 'customer'
}

export async function verifyTokenFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  const token = request.cookies.get('token')?.value ||
    request.headers.get('authorization')?.split(' ')[1]

  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET_VALIDATED) as { userId: string; email: string; role: string }
    
    const result = await db.query(
      'SELECT id, email, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    )

    if (result.rows.length === 0) return null

    return {
      id: result.rows[0].id,
      email: result.rows[0].email,
      role: result.rows[0].role,
    }
  } catch {
    return null;
  }
}

export function requireRole(roles: string[]) {
  return async (request: NextRequest, user: AuthenticatedUser) => {
    if (!roles.includes(user.role)) {
      throw new Error('Forbidden: Insufficient permissions')
    }
  }
}