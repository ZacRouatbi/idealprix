import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'manager' | 'staff' | 'customer'
  avatar_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  user: User
  token: string
}

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const JWT_SECRET_VALIDATED = JWT_SECRET! as string

export class AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    )

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials')
    }

    const user = result.rows[0]

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new Error('Account is temporarily locked. Please try again later.')
    }

    const isValid = await bcrypt.compare(password, user.password_hash)

    if (!isValid) {
      const failedAttempts = (user.failed_login_attempts || 0) + 1
      const lockUntil = failedAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null

      await db.query(
        'UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3',
        [failedAttempts, lockUntil, user.id]
      )
      throw new Error('Invalid credentials')
    }

    await db.query(
      'UPDATE users SET last_login = NOW(), failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
      [user.id]
    )

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET_VALIDATED,
      { expiresIn: '7d' }
    )

    const { password_hash, ...userWithoutPassword } = user
    return { user: userWithoutPassword as User, token }
  }

  async register(userData: {
    email: string
    password: string
    first_name?: string
    last_name?: string
    role?: 'admin' | 'manager' | 'staff' | 'customer'
  }): Promise<AuthResponse> {
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [userData.email]
    )

    if (existingUser.rows.length > 0) {
      throw new Error('Email already registered')
    }

    const password_hash = await bcrypt.hash(userData.password, 10)

    const result = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        userData.email,
        password_hash,
        userData.first_name || '',
        userData.last_name || '',
        userData.role || 'staff',
      ]
    )

    const user = result.rows[0]
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET_VALIDATED,
      { expiresIn: '7d' }
    )

    const { password_hash: _, ...userWithoutPassword } = user
    return { user: userWithoutPassword as User, token }
  }

  async verifyToken(token: string): Promise<User> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET_VALIDATED) as { userId: string }
      
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      )

      if (result.rows.length === 0) {
        throw new Error('User not found')
      }

      const { password_hash, ...user } = result.rows[0]
      return user as User
    } catch (error) {
      throw new Error('Invalid token')
    }
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [id]
    )

    if (result.rows.length === 0) return null

    const { password_hash, ...user } = result.rows[0]
    return user as User
  }
}

export const authService = new AuthService()