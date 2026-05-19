import { db } from '@/lib/db'
import { PaginatedResponse, FilterParams } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import { buildPaginationLinks } from '@/lib/pagination'

export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  price: number
  compare_price?: number
  category_id?: string
  image_url?: string
  is_active: boolean
  is_featured: boolean
  sku?: string
  stock_quantity: number
  low_stock_threshold: number
  weight?: number
  dimensions?: any
  seo_title?: string
  seo_description?: string
  created_at: string
  updated_at: string
  category?: {
    id: string
    name: string
    slug: string
    description?: string
    image_url?: string
  }
}

export interface ProductFilters extends FilterParams {
  category_id?: string
  is_active?: boolean
  is_featured?: boolean
  min_price?: number
  max_price?: number
  in_stock?: boolean
}

export class ProductService {
  /**
   * Optimized pagination with keyset-style approach for large datasets
   * Uses cursor-based pagination when cursor is provided
   */
  async listProducts(filters?: ProductFilters & { cursor?: string }): Promise<PaginatedResponse<Product>> {
    const limit = Math.max(1, Math.min(100, filters?.limit || 50))
    const offset = Math.max(0, filters?.offset || 0)

    let baseQuery = `
      SELECT p.id, p.name, p.slug, p.description, p.price, p.compare_price,
             p.category_id, p.image_url, p.is_active, p.is_featured, p.sku,
             p.stock_quantity, p.low_stock_threshold, p.weight, p.dimensions,
             p.seo_title, p.seo_description, p.created_at, p.updated_at,
             c.id as cat_id, c.name as cat_name, c.slug as cat_slug,
             c.description as cat_description, c.image_url as cat_image_url
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    // Cursor-based pagination for better performance on large datasets
    if (filters?.cursor) {
      conditions.push(`p.id > $${paramIndex++}`)
      params.push(filters.cursor)
    }

    if (filters?.category_id) {
      conditions.push(`p.category_id = $${paramIndex++}`)
      params.push(filters.category_id)
    }

    if (filters?.is_active !== undefined) {
      conditions.push(`p.is_active = $${paramIndex++}`)
      params.push(filters.is_active)
    }

    if (filters?.in_stock) {
      conditions.push(`p.stock_quantity > 0`)
    }

    if (filters?.min_price !== undefined) {
      conditions.push(`p.price >= $${paramIndex++}`)
      params.push(filters.min_price)
    }

    if (filters?.max_price !== undefined) {
      conditions.push(`p.price <= $${paramIndex++}`)
      params.push(filters.max_price)
    }

    if (filters?.search) {
      conditions.push(`(p.name ILIKE $${paramIndex++} OR p.description ILIKE $${paramIndex++})`)
      params.push(`%${filters.search}%`, `%${filters.search}%`)
    }

    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ')
    }

    // Use indexed ordering
    baseQuery += ` ORDER BY p.id DESC LIMIT ${limit + 1}`

    const result = await db.query(baseQuery, params)

    // Transform rows to include category
    const products = result.rows.map((row: any) => {
      const { 
        cat_id, cat_name, cat_slug, cat_description, cat_image_url,
        ...productFields 
      } = row
      return {
        ...productFields,
        category: cat_id ? {
          id: cat_id,
          name: cat_name,
          slug: cat_slug,
          description: cat_description,
          image_url: cat_image_url,
        } : undefined,
        is_featured: row.is_featured ?? false
      }
    })

    // Check if there's more data for cursor pagination
    let data = products as Product[]
    let newOffset = offset
    let hasMore = false

    if (data.length > limit) {
      hasMore = true
      data = data.slice(0, limit)
    }

    // Calculate count only when needed (skip for cursor-based)
    let count = 0
    if (!filters?.cursor) {
      const countQuery = `
        SELECT COUNT(*) as count 
        FROM (
          ${baseQuery.replace(` ORDER BY p.id DESC LIMIT ${limit + 1}`, '')}
        ) subquery
      `
      const countResult = await db.query(countQuery, params)
      count = parseInt(countResult.rows[0].count)
      newOffset = offset + data.length
    } else {
      count = offset + data.length + (hasMore ? 1 : 0)
    }

    return {
      data,
      count,
      limit,
      offset: newOffset,
      page: Math.floor((filters?.offset || 0) / limit) + 1,
      totalPages: Math.ceil(count / limit),
    }
  }

  async getProduct(id: string): Promise<Product | null> {
    const result = await db.query('SELECT * FROM products WHERE id = $1', [id])
    return result.rows[0] as Product || null
  }

  async getProductBySlug(slug: string): Promise<Product | null> {
    const result = await db.query('SELECT * FROM products WHERE slug = $1 AND is_active = true', [slug])
    return result.rows[0] as Product || null
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    if (!data.name) {
      throw new Error('Product name is required')
    }
    if (data.price === undefined || data.price === null) {
      throw new Error('Product price is required')
    }
    
    const sku = data.sku || `PRD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-')
    
    const result = await db.query(
      `INSERT INTO products (id, name, slug, description, price, compare_price, category_id, image_url, sku, stock_quantity, low_stock_threshold, is_active, is_featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        uuidv4(),
        data.name,
        slug,
        data.description,
        data.price,
        data.compare_price,
        data.category_id && data.category_id !== '' ? data.category_id : null,
        data.image_url,
        sku,
        data.stock_quantity ?? 0,
        data.low_stock_threshold ?? 10,
        data.is_active ?? true,
        data.is_featured ?? false,
      ]
    )

    await db.query(
      'INSERT INTO inventory (id, product_id, quantity) VALUES ($1, $2, $3)',
      [uuidv4(), result.rows[0].id, data.stock_quantity ?? 0]
    )

    return result.rows[0] as Product
  }

async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`)
      values.push(data.name)
    }
    if (data.slug !== undefined) {
      fields.push(`slug = $${paramIndex++}`)
      values.push(data.slug)
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`)
      values.push(data.description)
    }
    if (data.price !== undefined) {
      fields.push(`price = $${paramIndex++}`)
      values.push(data.price)
    }
    if (data.compare_price !== undefined) {
      fields.push(`compare_price = $${paramIndex++}`)
      values.push(data.compare_price)
    }
    if (data.category_id !== undefined) {
      fields.push(`category_id = $${paramIndex++}`)
      values.push(data.category_id && data.category_id !== '' ? data.category_id : null)
    }
    if (data.image_url !== undefined) {
      fields.push(`image_url = $${paramIndex++}`)
      values.push(data.image_url)
    }
    if (data.sku !== undefined) {
      fields.push(`sku = $${paramIndex++}`)
      values.push(data.sku)
    }
    if (data.stock_quantity !== undefined) {
      fields.push(`stock_quantity = $${paramIndex++}`)
      values.push(data.stock_quantity)
    }
    if (data.low_stock_threshold !== undefined) {
      fields.push(`low_stock_threshold = $${paramIndex++}`)
      values.push(data.low_stock_threshold)
    }
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramIndex++}`)
      values.push(data.is_active)
    }
    if (data.is_featured !== undefined) {
      fields.push(`is_featured = $${paramIndex++}`)
      values.push(data.is_featured)
    }

    fields.push('updated_at = NOW()')
    values.push(id)

    const result = await db.query(
      `UPDATE products 
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    )

    if (data.stock_quantity !== undefined) {
      await db.query(
        'UPDATE inventory SET quantity = $1, last_updated = NOW() WHERE product_id = $2',
        [data.stock_quantity, id]
      )
    }

    return result.rows[0] as Product
  }

  async deleteProduct(id: string): Promise<void> {
    await db.query('DELETE FROM products WHERE id = $1', [id])
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    return this.updateProduct(id, { stock_quantity: quantity })
  }
}

export const productService = new ProductService()