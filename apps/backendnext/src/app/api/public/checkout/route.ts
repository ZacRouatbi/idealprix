import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { validateCreateOrderInput } from '@/lib/validation'
import { rateLimit } from '@/lib/validation'

const publicRateLimit = rateLimit({
  windowMs: 60000,
  maxRequests: 30,
})

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:5173', 'http://localhost:3000']

function addCorsHeaders(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get('origin')
  if (origin && ALLOWED_ORIGINS.some(allowed => allowed === origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-csrf-token')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

export async function OPTIONS(request: NextRequest) {
  return addCorsHeaders(new NextResponse(null, { status: 200 }), request)
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = await publicRateLimit(request)
  if (rateLimitResponse) return addCorsHeaders(rateLimitResponse, request)

  try {
    const data = await request.json()

    const validation = validateCreateOrderInput(data)
    if (!validation.valid) {
      return addCorsHeaders(NextResponse.json({ error: validation.error }, { status: 400 }), request)
    }

    const itemIds = data.items.map((item: any) => item.productId)
    const productCheck = await db.query(
      'SELECT id, name, price, stock_quantity FROM products WHERE id = ANY($1) AND is_active = true',
      [itemIds]
    )

    if (productCheck.rows.length !== itemIds.length) {
      return addCorsHeaders(NextResponse.json({ error: 'One or more products not found or unavailable' }, { status: 400 }), request)
    }

    for (const item of data.items) {
      const product = productCheck.rows.find((p: any) => p.id === item.productId)
      if (product && product.stock_quantity < item.quantity) {
        return addCorsHeaders(
          NextResponse.json({ error: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}` }, { status: 400 }),
          request
        )
      }
    }

    const calculatedSubtotal = data.items.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0)
    const calculatedTotal = calculatedSubtotal + (data.shippingAmount || 0)

    if (Math.abs(calculatedSubtotal - data.subtotal) > 0.01) {
      return addCorsHeaders(NextResponse.json({ error: 'Subtotal mismatch' }, { status: 400 }), request)
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    const client = await db.getClient()
    try {
      await client.query('BEGIN')

      const orderResult = await client.query(
        `INSERT INTO orders (id, order_number, customer_email, customer_name, customer_phone,
          shipping_address, billing_address, subtotal, shipping_amount, total_amount, status, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [
          uuidv4(), orderNumber, data.customerEmail, data.customerName || null, data.customerPhone || null,
          JSON.stringify(data.shippingAddress),
          data.billingAddress ? JSON.stringify(data.billingAddress) : JSON.stringify(data.shippingAddress),
          calculatedSubtotal, data.shippingAmount || 0, calculatedTotal, 'pending', data.notes || null,
        ]
      )

      const order = orderResult.rows[0]

      for (const item of data.items) {
        await client.query(
          `INSERT INTO order_items (id, order_id, product_id, product_name, product_sku,
            quantity, unit_price, total_price, product_image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [uuidv4(), order.id, item.productId, item.productName, item.productSku || null,
           item.quantity, item.unitPrice, item.unitPrice * item.quantity, item.productImage || null]
        )
        await client.query('UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2', [item.quantity, item.productId])
      }

      await client.query('COMMIT')
      return addCorsHeaders(NextResponse.json({ order: { id: order.id, order_number: order.order_number, status: order.status, total_amount: order.total_amount } }, { status: 201 }), request)

    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

  } catch (error: any) {
    console.error('Checkout error:', error)
    return addCorsHeaders(NextResponse.json({ error: 'Failed to create order' }, { status: 500 }), request)
  }
}