import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PromotionService } from '@/services/promotion-service'

const mockDb = {
  query: vi.fn(),
}

vi.mock('@/lib/db', () => ({
  db: mockDb,
}))

describe('PromoCodeService', () => {
  let service: PromotionService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new PromotionService()
  })

  describe('listPromoCodes', () => {
    it('should return paginated promo codes', async () => {
      const mockData = [
        { id: '1', code: 'SUMMER2026', discount_type: 'percentage', discount_value: 15, start_date: '2026-06-01', end_date: '2026-06-30', min_order_value: 10000, usage_limit: 100, used_count: 23, is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' }
      ]
      mockDb.query.mockResolvedValueOnce({ rows: mockData, command: { rowCount: 1 } })
      mockDb.query.mockResolvedValueOnce({ rows: [{ count: '1' }] })

      const result = await service.listPromoCodes({ limit: 10, offset: 0 })

      expect(result.data).toHaveLength(1)
      expect(result.count).toBe(1)
    })

    it('should search by code', async () => {
      const mockData = [{ id: '1', code: 'SUMMER2026', discount_type: 'percentage', discount_value: 15, start_date: '2026-06-01', end_date: '2026-06-30', min_order_value: 10000, usage_limit: 100, used_count: 23, is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' }]
      mockDb.query.mockResolvedValueOnce({ rows: mockData, command: { rowCount: 1 } })
      mockDb.query.mockResolvedValueOnce({ rows: [{ count: '1' }] })

      await service.listPromoCodes({ search: 'SUMMER', limit: 10 })

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('code ILIKE $1'),
        expect.any(Array)
      )
    })
  })

  describe('createPromoCode', () => {
    it('should create a new promo code', async () => {
      const mockResult = { id: '1', code: 'SUMMER2026', discount_type: 'percentage', discount_value: 15, start_date: '2026-06-01', end_date: '2026-06-30', min_order_value: 10000, usage_limit: 100, used_count: 0, is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' }
      mockDb.query.mockResolvedValueOnce({ rows: [mockResult], command: { rowCount: 1 } })

      const result = await service.createPromoCode({
        code: 'SUMMER2026',
        discountType: 'percentage',
        discountValue: 15,
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        minOrderValue: 10000,
        usageLimit: 100,
        isActive: true,
      })

      expect(result.id).toBeDefined()
      expect(result.code).toBe('SUMMER2026')
      expect(result.usedCount).toBe(0)
    })
  })

  describe('getPromoCode', () => {
    it('should return a promo code by id', async () => {
      const mockResult = { id: '1', code: 'SUMMER2026', discount_type: 'percentage', discount_value: 15, start_date: '2026-06-01', end_date: '2026-06-30', min_order_value: 10000, usage_limit: 100, used_count: 23, is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' }
      mockDb.query.mockResolvedValueOnce({ rows: [mockResult] })

      const result = await service.getPromoCode('1')

      expect(result).toBeDefined()
      expect(result?.code).toBe('SUMMER2026')
    })
  })

  describe('deletePromoCode', () => {
    it('should delete a promo code', async () => {
      mockDb.query.mockResolvedValueOnce({ command: { rowCount: 1 } })

      await service.deletePromoCode('1')

      expect(mockDb.query).toHaveBeenCalledWith('DELETE FROM promo_codes WHERE id = $1', ['1'])
    })
  })
})
