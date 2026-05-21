import { db, PaginatedResponse, FilterParams } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parent_id?: string
  image_url?: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
  children?: Category[]
}

export interface CategoryFilters extends FilterParams {
  parent_id?: string
  is_active?: boolean
}

export class CategoryService {
  async listCategories(filters?: CategoryFilters): Promise<PaginatedResponse<Category>> {
    let query = 'SELECT * FROM categories'
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (filters?.parent_id) {
      conditions.push(`parent_id = $${paramIndex++}`)
      params.push(filters.parent_id)
    }

    if (filters?.is_active !== undefined) {
      conditions.push(`is_active = $${paramIndex++}`)
      params.push(filters.is_active)
    }

    if (filters?.search) {
      conditions.push(`(name ILIKE $${paramIndex++} OR description ILIKE $${paramIndex++})`)
      params.push(`%${filters.search}%`, `%${filters.search}%`)
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ` ORDER BY sort_order ASC LIMIT ${filters?.limit || 50} OFFSET ${filters?.offset || 0}`

    const result = await db.query(query, params)
    
    const countResult = await db.query('SELECT COUNT(*) FROM categories c' + (conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : ''), params)

    return {
      data: result.rows as Category[],
      count: parseInt(countResult.rows[0].count),
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
      page: Math.floor((filters?.offset || 0) / (filters?.limit || 50)) + 1,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / (filters?.limit || 50)),
    }
  }

  async getCategory(id: string): Promise<Category | null> {
    const result = await db.query('SELECT * FROM categories WHERE id = $1', [id])
    return result.rows[0] as Category || null
  }

  async createCategory(data: Partial<Category>): Promise<Category> {
    const result = await db.query(
      `INSERT INTO categories (id, name, slug, description, parent_id, image_url, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        uuidv4(),
        data.name,
        data.slug || data.name?.toLowerCase().replace(/\s+/g, '-'),
        data.description,
        data.parent_id,
        data.image_url,
        data.sort_order || 0,
      ]
    )
    return result.rows[0] as Category
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const result = await db.query(
      `UPDATE categories 
       SET name = COALESCE($1, name),
           slug = COALESCE($2, slug),
           description = COALESCE($3, description),
           parent_id = COALESCE($4, parent_id),
           image_url = COALESCE($5, image_url),
           is_active = COALESCE($6, is_active),
           sort_order = COALESCE($7, sort_order),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        data.name,
        data.slug,
        data.description,
        data.parent_id,
        data.image_url,
        data.is_active,
        data.sort_order,
        id,
      ]
    )
    return result.rows[0] as Category
  }

  async deleteCategory(id: string): Promise<void> {
    await db.query('DELETE FROM categories WHERE id = $1', [id])
  }
}

export const categoryService = new CategoryService()