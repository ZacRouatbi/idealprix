import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

export function rateLimit(config: RateLimitConfig) {
  return async (request: NextRequest) => {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    const key = `${ip}:${request.nextUrl.pathname}`
    const now = Date.now()
    
    const entry = rateLimitStore.get(key)
    
    if (!entry || now > entry.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      })
      return null
    }
    
    if (entry.count >= config.maxRequests) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: Math.ceil((entry.resetTime - now) / 1000) },
        { status: 429 }
      )
    }
    
    entry.count++
    return null
  }
}

export const defaultRateLimit = rateLimit({
  windowMs: 60000,
  maxRequests: 100,
})

export function sanitizeString(input: string, maxLength = 1000): string {
  return input.trim().substring(0, maxLength)
}

export function sanitizeNumber(input: any, defaultValue = 0, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER): number {
  const num = Number(input)
  if (isNaN(num)) return defaultValue
  return Math.max(min, Math.min(max, num))
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' }
  }
  if (password.length > 128) {
    return { valid: false, message: 'Password must be less than 128 characters' }
  }
  return { valid: true }
}

export function validateUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

// Order validation
export interface OrderItemInput {
  productId: string
  productName: string
  productSku?: string
  quantity: number
  unitPrice: number
  productImage?: string
}

export interface CreateOrderInput {
  items: OrderItemInput[]
  customerEmail: string
  customerName?: string
  customerPhone?: string
  shippingAddress: {
    fullName: string
    address: string
    city: string
    postalCode: string
    countryCode: string
    phone?: string
  }
  billingAddress?: {
    fullName: string
    address: string
    city: string
    postalCode: string
    countryCode: string
    phone?: string
  }
  subtotal: number
  shippingAmount: number
  notes?: string
}

export function validateCreateOrderInput(data: any): { valid: boolean; error?: string } {
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    return { valid: false, error: 'Order must contain at least one item' }
  }

  if (!data.customerEmail || typeof data.customerEmail !== 'string') {
    return { valid: false, error: 'Customer email is required' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.customerEmail)) {
    return { valid: false, error: 'Invalid customer email format' }
  }

  if (!data.shippingAddress) {
    return { valid: false, error: 'Shipping address is required' }
  }

  const requiredAddressFields = ['fullName', 'address', 'city', 'postalCode', 'countryCode']
  for (const field of requiredAddressFields) {
    if (!data.shippingAddress[field]) {
      return { valid: false, error: `Shipping address ${field} is required` }
    }
  }

  if (typeof data.subtotal !== 'number' || data.subtotal < 0) {
    return { valid: false, error: 'Invalid subtotal amount' }
  }

  // Validate items
  for (const item of data.items) {
    if (!item.productId || !item.quantity || !item.unitPrice) {
      return { valid: false, error: 'Each order item must have productId, quantity, and unitPrice' }
    }
    if (item.quantity <= 0 || item.unitPrice < 0) {
      return { valid: false, error: 'Invalid item quantity or price' }
    }
  }

  return { valid: true }
}