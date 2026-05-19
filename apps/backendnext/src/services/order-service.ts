import { db } from '@/lib/db'
import { PaginatedResponse, FilterParams } from '@/types'
import { OrderStatus } from '@/types'

export type { OrderStatus } from '@/types'

export interface Order {
  id: string
  order_number: string
  status: OrderStatus
  subtotal: number
  tax_amount: number
  shipping_amount: number
  total_amount: number
  currency: string
  customer_email: string
  customer_name?: string
  customer_phone?: string
  shipping_address?: any
  billing_address?: any
  notes?: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id?: string
  product_name: string
  product_sku?: string
  quantity: number
  unit_price: number
  total_price: number
  product_image?: string
}

export interface OrderWithItems extends Order {
  items: OrderItem[]
}

export interface OrderFilters extends FilterParams {
  status?: OrderStatus
  created_at?: { from?: string; to?: string }
  total?: { min?: number; max?: number }
}

export class OrderService {
  async listOrders(filters?: OrderFilters): Promise<PaginatedResponse<Order>> {
    let query = 'SELECT * FROM orders'
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (filters?.status) {
      conditions.push(`status = $${paramIndex++}`)
      params.push(filters.status)
    }

    if (filters?.created_at?.from) {
      conditions.push(`created_at >= $${paramIndex++}`)
      params.push(filters.created_at.from)
    }

    if (filters?.created_at?.to) {
      conditions.push(`created_at <= $${paramIndex++}`)
      params.push(filters.created_at.to)
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ` ORDER BY created_at DESC LIMIT ${filters?.limit || 50} OFFSET ${filters?.offset || 0}`

    const result = await db.query(query, params)
    
    const countResult = await db.query(
      'SELECT COUNT(*) FROM orders' + (conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : ''),
      params
    )

    return {
      data: result.rows as Order[],
      count: parseInt(countResult.rows[0].count),
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
      page: Math.floor((filters?.offset || 0) / (filters?.limit || 50)) + 1,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / (filters?.limit || 50)),
    }
  }

  async getOrder(id: string): Promise<OrderWithItems | null> {
    const orderResult = await db.query('SELECT * FROM orders WHERE id = $1', [id])
    
    if (orderResult.rows.length === 0) return null

    const itemsResult = await db.query('SELECT * FROM order_items WHERE order_id = $1', [id])

    return {
      ...orderResult.rows[0] as Order,
      items: itemsResult.rows as OrderItem[],
    }
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const result = await db.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    )
    return result.rows[0] as Order
  }

  async getOrdersByStatus(): Promise<Record<OrderStatus, number>> {
    const result = await db.query(
      "SELECT status, COUNT(*) as count FROM orders GROUP BY status"
    )
    return result.rows.reduce((acc, row) => {
      acc[row.status as OrderStatus] = parseInt(row.count)
      return acc
    }, {} as Record<OrderStatus, number>)
  }

  async getRecentOrders(limit: number = 10): Promise<Order[]> {
    const result = await db.query(
      'SELECT * FROM orders ORDER BY created_at DESC LIMIT $1',
      [limit]
    )
    return result.rows as Order[]
  }

  async getOrderStats(): Promise<{ total: number; total_amount: number }> {
    const result = await db.query(
      'SELECT COUNT(*) as total, COALESCE(SUM(total_amount), 0) as total_amount FROM orders'
    )
    return {
      total: parseInt(result.rows[0].total),
      total_amount: parseFloat(result.rows[0].total_amount),
    }
  }
}

export const orderService = new OrderService()