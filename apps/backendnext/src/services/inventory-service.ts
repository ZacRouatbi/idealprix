import { db } from '@/lib/db'
import { PaginatedResponse, FilterParams } from '@/types'

export interface InventoryItem {
  id: string
  product_id: string
  product_name?: string
  product_sku?: string
  product_image?: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  low_stock_threshold?: number
  location?: string
  last_updated: string
  created_at: string
}

export interface InventoryFilters extends FilterParams {
  location?: string
  low_stock?: boolean
  product_id?: string
}

export class InventoryService {
  async listInventory(filters?: InventoryFilters): Promise<PaginatedResponse<InventoryItem>> {
    let query = `
      SELECT i.*, p.name as product_name, p.sku as product_sku, p.image_url as product_image, p.low_stock_threshold
      FROM inventory i
      LEFT JOIN products p ON i.product_id = p.id
    `
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (filters?.product_id) {
      conditions.push(`i.product_id = $${paramIndex++}`)
      params.push(filters.product_id)
    }

    if (filters?.low_stock) {
      conditions.push(`(i.quantity - i.reserved_quantity) < (SELECT low_stock_threshold FROM products WHERE id = i.product_id)`)
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ` ORDER BY i.last_updated DESC LIMIT ${filters?.limit || 50} OFFSET ${filters?.offset || 0}`

    const result = await db.query(query, params)
    
    const countResult = await db.query(
      'SELECT COUNT(*) FROM inventory i' + (conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : ''),
      params
    )

    return {
      data: result.rows as InventoryItem[],
      count: parseInt(countResult.rows[0].count),
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
      page: Math.floor((filters?.offset || 0) / (filters?.limit || 50)) + 1,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / (filters?.limit || 50)),
    }
  }

  async getInventoryItem(productId: string): Promise<InventoryItem | null> {
    const result = await db.query(
      `SELECT i.*, p.name as product_name, p.sku as product_sku, p.image_url as product_image, p.low_stock_threshold
       FROM inventory i
       LEFT JOIN products p ON i.product_id = p.id
       WHERE i.product_id = $1`,
      [productId]
    )
    return result.rows[0] as InventoryItem || null
  }

  async updateInventory(
    productId: string,
    quantity?: number,
    location?: string
  ): Promise<InventoryItem> {
    const result = await db.query(
      `UPDATE inventory 
       SET quantity = COALESCE($1, quantity),
           location = COALESCE($2, location),
           last_updated = NOW()
       WHERE product_id = $3
       RETURNING *`,
      [quantity, location, productId]
    )

    return result.rows[0] as InventoryItem
  }

  async adjustInventory(
    productId: string,
    quantity: number,
    userId?: string
  ): Promise<InventoryItem> {
    const result = await db.query(
      `UPDATE inventory 
       SET quantity = quantity + $1,
           last_updated = NOW(),
           updated_by = $2
       WHERE product_id = $3
       RETURNING *`,
      [quantity, userId, productId]
    )

    return result.rows[0] as InventoryItem
  }

  async updateInventoryLocation(
    productId: string,
    location: string
  ): Promise<InventoryItem> {
    const result = await db.query(
      `UPDATE inventory 
       SET location = $1,
           last_updated = NOW()
       WHERE product_id = $2
       RETURNING *`,
      [location, productId]
    )

    return result.rows[0] as InventoryItem
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    const result = await db.query(`
      SELECT i.*, p.name as product_name, p.sku as product_sku, p.image_url as product_image, p.low_stock_threshold
      FROM inventory i
      LEFT JOIN products p ON i.product_id = p.id
      WHERE (i.quantity - i.reserved_quantity) < COALESCE(p.low_stock_threshold, 10)
      ORDER BY (i.quantity - i.reserved_quantity) ASC
    `)
    return result.rows as InventoryItem[]
  }

  async deleteInventoryItem(productId: string): Promise<void> {
    await db.query('DELETE FROM inventory WHERE product_id = $1', [productId])
  }
}

export const inventoryService = new InventoryService()