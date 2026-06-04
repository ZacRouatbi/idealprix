import { db } from '@/lib/db'
import { PaginatedResponse, FilterParams } from '@/types'
import { v4 as uuidv4 } from 'uuid'

export interface Promotion {
  id: string
  targetType: "product" | "category"
  targetId: string
  targetName: string
  discountType: "percentage" | "fixed"
  discountValue: number
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PromoCode {
  id: string
  code: string
  discountType: "percentage" | "fixed"
  discountValue: number
  startDate: string
  endDate: string
  minOrderValue: number
  usageLimit?: number
  usedCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PromotionFilters extends FilterParams {
  targetType?: string
  isActive?: boolean
  search?: string
}

export class PromotionService {
  async listPromotions(filters?: PromotionFilters): Promise<PaginatedResponse<Promotion>> {
    let query = `
      SELECT p.id,
             p.target_type    AS "targetType",
             p.target_id      AS "targetId",
             p.target_name    AS "targetName",
             p.discount_type  AS "discountType",
             p.discount_value AS "discountValue",
             p.start_date     AS "startDate",
             p.end_date       AS "endDate",
             p.is_active      AS "isActive",
             p.created_at     AS "createdAt",
             p.updated_at     AS "updatedAt"
      FROM promotions p
    `
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (filters?.targetType) {
      conditions.push(`p.target_type = $${paramIndex++}`)
      params.push(filters.targetType)
    }

    if (filters?.isActive !== undefined) {
      conditions.push(`p.is_active = $${paramIndex++}`)
      params.push(filters.isActive)
    }

    if (filters?.search) {
      conditions.push(`(p.target_name ILIKE $${paramIndex++} OR p.target_id ILIKE $${paramIndex++})`)
      params.push(`%${filters.search}%`, `%${filters.search}%`)
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ` ORDER BY p.created_at DESC LIMIT ${filters?.limit || 50} OFFSET ${filters?.offset || 0}`

    const result = await db.query(query, params)

    const countResult = await db.query(
      'SELECT COUNT(*) FROM promotions p' + (conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : ''),
      params
    )

    return {
      data: result.rows as Promotion[],
      count: parseInt(countResult.rows[0].count),
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
      page: Math.floor((filters?.offset || 0) / (filters?.limit || 50)) + 1,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / (filters?.limit || 50)),
    }
  }

  async getPromotion(id: string): Promise<Promotion | null> {
    const result = await db.query('SELECT * FROM promotions WHERE id = $1', [id])
    return result.rows[0] as Promotion || null
  }

  async createPromotion(data: {
    targetType: "product" | "category"
    targetId: string
    targetName: string
    discountType: "percentage" | "fixed"
    discountValue: number
    startDate: string
    endDate: string
    isActive?: boolean
  }): Promise<Promotion> {
    const result = await db.query(
      `INSERT INTO promotions (id, target_type, target_id, target_name, discount_type, discount_value, start_date, end_date, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [
        uuidv4(),
        data.targetType,
        data.targetId,
        data.targetName,
        data.discountType,
        data.discountValue,
        data.startDate,
        data.endDate,
        data.isActive ?? true,
      ]
    )
    return result.rows[0] as Promotion
  }

  async updatePromotion(id: string, data: Partial<Promotion>): Promise<Promotion> {
    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (data.targetType !== undefined) {
      fields.push(`target_type = $${paramIndex++}`)
      values.push(data.targetType)
    }
    if (data.targetId !== undefined) {
      fields.push(`target_id = $${paramIndex++}`)
      values.push(data.targetId)
    }
    if (data.targetName !== undefined) {
      fields.push(`target_name = $${paramIndex++}`)
      values.push(data.targetName)
    }
    if (data.discountType !== undefined) {
      fields.push(`discount_type = $${paramIndex++}`)
      values.push(data.discountType)
    }
    if (data.discountValue !== undefined) {
      fields.push(`discount_value = $${paramIndex++}`)
      values.push(data.discountValue)
    }
    if (data.startDate !== undefined) {
      fields.push(`start_date = $${paramIndex++}`)
      values.push(data.startDate)
    }
    if (data.endDate !== undefined) {
      fields.push(`end_date = $${paramIndex++}`)
      values.push(data.endDate)
    }
    if (data.isActive !== undefined) {
      fields.push(`is_active = $${paramIndex++}`)
      values.push(data.isActive)
    }

    fields.push('updated_at = NOW()')
    values.push(id)

    const result = await db.query(
      `UPDATE promotions SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )
    return result.rows[0] as Promotion
  }

  async deletePromotion(id: string): Promise<void> {
    await db.query('DELETE FROM promotions WHERE id = $1', [id])
  }

  async listPromoCodes(filters?: FilterParams & { search?: string; isActive?: boolean }): Promise<PaginatedResponse<PromoCode>> {
    let query = `
      SELECT pc.id,
             pc.code,
             pc.discount_type   AS "discountType",
             pc.discount_value  AS "discountValue",
             pc.start_date      AS "startDate",
             pc.end_date        AS "endDate",
             pc.min_order_value AS "minOrderValue",
             pc.usage_limit     AS "usageLimit",
             COALESCE((
               SELECT COUNT(*) FROM promo_code_usage pcu 
               WHERE pcu.promo_code_id = pc.id
             ), 0) AS "usedCount",
             pc.is_active       AS "isActive",
             pc.created_at      AS "createdAt",
             pc.updated_at      AS "updatedAt"
      FROM promo_codes pc
    `
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (filters?.search) {
      conditions.push(`pc.code ILIKE $${paramIndex++}`)
      params.push(`%${filters.search}%`)
    }

    if (filters?.isActive !== undefined) {
      conditions.push(`pc.is_active = $${paramIndex++}`)
      params.push(filters.isActive)
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ` ORDER BY pc.created_at DESC LIMIT ${filters?.limit || 50} OFFSET ${filters?.offset || 0}`

    const result = await db.query(query, params)

    const countResult = await db.query(
      'SELECT COUNT(*) FROM promo_codes pc' + (conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : ''),
      params
    )

    return {
      data: result.rows as PromoCode[],
      count: parseInt(countResult.rows[0].count),
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
      page: Math.floor((filters?.offset || 0) / (filters?.limit || 50)) + 1,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / (filters?.limit || 50)),
    }
  }

  async getPromoCode(id: string): Promise<PromoCode | null> {
    const result = await db.query('SELECT * FROM promo_codes WHERE id = $1', [id])
    if (!result.rows[0]) return null
    
    const promoCode = result.rows[0] as PromoCode
    
    // Get accurate usage count from usage table
    const usageResult = await db.query(
      'SELECT COUNT(*) as count FROM promo_code_usage WHERE promo_code_id = $1',
      [id]
    )
    promoCode.usedCount = parseInt(usageResult.rows[0].count)
    
    return promoCode
  }

  async createPromoCode(data: {
    code: string
    discountType: "percentage" | "fixed"
    discountValue: number
    startDate: string
    endDate: string
    minOrderValue: number
    usageLimit?: number
    isActive?: boolean
  }): Promise<PromoCode> {
    const result = await db.query(
      `INSERT INTO promo_codes (id, code, discount_type, discount_value, start_date, end_date, min_order_value, usage_limit, used_count, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, NOW(), NOW())
       RETURNING *`,
      [
        uuidv4(),
        data.code,
        data.discountType,
        data.discountValue,
        data.startDate,
        data.endDate,
        data.minOrderValue,
        data.usageLimit,
        data.isActive ?? true,
      ]
    )
    return result.rows[0] as PromoCode
  }

  async updatePromoCode(id: string, data: Partial<PromoCode>): Promise<PromoCode> {
    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (data.code !== undefined) {
      fields.push(`code = $${paramIndex++}`)
      values.push(data.code)
    }
    if (data.discountType !== undefined) {
      fields.push(`discount_type = $${paramIndex++}`)
      values.push(data.discountType)
    }
    if (data.discountValue !== undefined) {
      fields.push(`discount_value = $${paramIndex++}`)
      values.push(data.discountValue)
    }
    if (data.startDate !== undefined) {
      fields.push(`start_date = $${paramIndex++}`)
      values.push(data.startDate)
    }
    if (data.endDate !== undefined) {
      fields.push(`end_date = $${paramIndex++}`)
      values.push(data.endDate)
    }
    if (data.minOrderValue !== undefined) {
      fields.push(`min_order_value = $${paramIndex++}`)
      values.push(data.minOrderValue)
    }
    if (data.usageLimit !== undefined) {
      fields.push(`usage_limit = $${paramIndex++}`)
      values.push(data.usageLimit)
    }
    if (data.usedCount !== undefined) {
      fields.push(`used_count = $${paramIndex++}`)
      values.push(data.usedCount)
    }
    if (data.isActive !== undefined) {
      fields.push(`is_active = $${paramIndex++}`)
      values.push(data.isActive)
    }

    fields.push('updated_at = NOW()')
    values.push(id)

    const result = await db.query(
      `UPDATE promo_codes SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )
    return result.rows[0] as PromoCode
  }

  async deletePromoCode(id: string): Promise<void> {
    await db.query('DELETE FROM promo_codes WHERE id = $1', [id])
  }

  async getPromoCodeByCode(code: string): Promise<PromoCode | null> {
    const now = new Date()
    const nowISO = now.toISOString()
    const result = await db.query(
      `SELECT pc.id,
              pc.code,
              pc.discount_type AS "discountType",
              pc.discount_value AS "discountValue",
              pc.start_date AS "startDate",
              pc.end_date AS "endDate",
              pc.min_order_value AS "minOrderValue",
              pc.usage_limit AS "usageLimit",
              pc.used_count AS "usedCount",
              pc.is_active AS "isActive",
              pc.created_at AS "createdAt",
              pc.updated_at AS "updatedAt"
       FROM promo_codes pc
       WHERE pc.code = $1
         AND pc.is_active = true
         AND pc.start_date <= $2
         AND pc.end_date >= $3
         AND (pc.usage_limit IS NULL OR pc.used_count < pc.usage_limit)`,
      [code, nowISO, nowISO]
    )
    return result.rows[0] as PromoCode || null
  }

  async getPromoCodeByCodeForUser(code: string, userId: string): Promise<PromoCode | null> {
    const now = new Date()
    const nowISO = now.toISOString()
    const result = await db.query(
      `SELECT pc.id,
              pc.code,
              pc.discount_type AS "discountType",
              pc.discount_value AS "discountValue",
              pc.start_date AS "startDate",
              pc.end_date AS "endDate",
              pc.min_order_value AS "minOrderValue",
              pc.usage_limit AS "usageLimit",
              pc.used_count AS "usedCount",
              pc.is_active AS "isActive",
              pc.created_at AS "createdAt",
              pc.updated_at AS "updatedAt"
       FROM promo_codes pc
       WHERE pc.code = $1
         AND pc.is_active = true
         AND pc.start_date <= $2
         AND pc.end_date >= $3
         AND NOT EXISTS (
           SELECT 1 FROM promo_code_usage pcu 
           WHERE pcu.promo_code_id = pc.id 
           AND pcu.user_id = $4
         )
         AND (pc.usage_limit IS NULL OR pc.used_count < pc.usage_limit)`,
      [code, nowISO, nowISO, userId]
    )
    return result.rows[0] as PromoCode || null
  }

  async getPromoCodeByCodeForIP(code: string, ipAddress: string | null): Promise<PromoCode | null> {
    const now = new Date()
    const nowISO = now.toISOString()
    const today = new Date().toISOString().split('T')[0]
    const result = await db.query(
      `SELECT pc.id,
              pc.code,
              pc.discount_type AS "discountType",
              pc.discount_value AS "discountValue",
              pc.start_date AS "startDate",
              pc.end_date AS "endDate",
              pc.min_order_value AS "minOrderValue",
              pc.usage_limit AS "usageLimit",
              pc.used_count AS "usedCount",
              pc.is_active AS "isActive",
              pc.created_at AS "createdAt",
              pc.updated_at AS "updatedAt"
       FROM promo_codes pc
       WHERE pc.code = $1
         AND pc.is_active = true
         AND pc.start_date <= $2
         AND pc.end_date >= $3
         AND (NOT EXISTS (
           SELECT 1 FROM promo_code_usage pcu 
           WHERE pcu.promo_code_id = pc.id 
           AND pcu.ip_address = $4
           AND pcu.used_at::date = $5
         ) OR $4 IS NULL)
         AND (pc.usage_limit IS NULL OR pc.used_count < pc.usage_limit)`,
      [code, nowISO, nowISO, ipAddress || null, today]
    )
    return result.rows[0] as PromoCode || null
  }

async incrementPromoCodeUsage(promoCodeId: string, userId?: string, orderId?: string, ipAddress?: string): Promise<void> {
    const client = await db.getClient()
    try {
      await client.query('BEGIN')

      // Insert usage record
      if (userId && orderId) {
        await client.query(
          `INSERT INTO promo_code_usage (id, promo_code_id, user_id, order_id)
           VALUES (gen_random_uuid(), $1, $2, $3)`,
          [promoCodeId, userId, orderId]
        )
      } else if (ipAddress && orderId) {
        await client.query(
          `INSERT INTO promo_code_usage (id, promo_code_id, ip_address, order_id)
           VALUES (gen_random_uuid(), $1, $2, $3)`,
          [promoCodeId, ipAddress, orderId]
        )
      } else if (ipAddress) {
        await client.query(
          `INSERT INTO promo_code_usage (id, promo_code_id, ip_address)
           VALUES (gen_random_uuid(), $1, $2)`,
          [promoCodeId, ipAddress]
        )
      } else if (orderId) {
        await client.query(
          `INSERT INTO promo_code_usage (id, promo_code_id, order_id)
           VALUES (gen_random_uuid(), $1, $2)`,
          [promoCodeId, orderId]
        )
      } else {
        await client.query(
          `INSERT INTO promo_code_usage (id, promo_code_id)
           VALUES (gen_random_uuid(), $1)`,
          [promoCodeId]
        )
      }

      // Increment used_count
      await client.query(
        'UPDATE promo_codes SET used_count = used_count + 1 WHERE id = $1',
        [promoCodeId]
      )

      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  async incrementPromoCodeUsageInTransaction(client: any, promoCodeId: string, userId?: string, orderId?: string, ipAddress?: string): Promise<void> {
    // Insert usage record
    if (userId && orderId) {
      await client.query(
        `INSERT INTO promo_code_usage (id, promo_code_id, user_id, order_id)
         VALUES (gen_random_uuid(), $1, $2, $3)`,
        [promoCodeId, userId, orderId]
      )
    } else if (ipAddress && orderId) {
      await client.query(
        `INSERT INTO promo_code_usage (id, promo_code_id, ip_address, order_id)
         VALUES (gen_random_uuid(), $1, $2, $3)`,
        [promoCodeId, ipAddress, orderId]
      )
    } else if (ipAddress) {
      await client.query(
        `INSERT INTO promo_code_usage (id, promo_code_id, ip_address)
         VALUES (gen_random_uuid(), $1, $2)`,
        [promoCodeId, ipAddress]
      )
    } else if (orderId) {
      await client.query(
        `INSERT INTO promo_code_usage (id, promo_code_id, order_id)
         VALUES (gen_random_uuid(), $1, $2)`,
        [promoCodeId, orderId]
      )
    } else {
      await client.query(
        `INSERT INTO promo_code_usage (id, promo_code_id)
         VALUES (gen_random_uuid(), $1)`,
        [promoCodeId]
      )
    }

    // Increment used_count
    await client.query(
      'UPDATE promo_codes SET used_count = used_count + 1 WHERE id = $1',
      [promoCodeId]
    )
  }

  async getPromoCodeUsageCount(promoCodeId: string): Promise<number> {
    const result = await db.query(
      'SELECT COUNT(*) FROM promo_code_usage WHERE promo_code_id = $1',
      [promoCodeId]
    )
    return parseInt(result.rows[0].count)
  }
 }

 export const promotionService = new PromotionService()

