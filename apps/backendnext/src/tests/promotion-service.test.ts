import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PromotionService } from '@/services/promotion-service'

const mockDb = {
  query: vi.fn(),
}

vi.mock('@/lib/db', () => ({
  db: mockDb,
}))

describe('PromotionService', () => {
  let service: PromotionService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new PromotionService()
  })

  describe('listPromotions', () => {
    it('should return paginated promotions', async () => {
      const mockData = [
        { id: '1', target_type: 'product', target_id: 'p1', target_name: 'Product 1', discount_type: 'percentage', discount_value: 15, start_date: '2026-06-01', end_date: '2026-06-30', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' }
      ]
      mockDb.query.mockResolvedValueOnce({ rows: mockData, command: { rowCount: 1 } })
      mockDb.query.mockResolvedValueOnce({ rows: [{ count: '1' }] })

      const result = await service.listPromotions({ limit: 10, offset: 0 })

      expect(result.data).toHaveLength(1)
      expect(result.count).toBe(1)
    })

    it('should filter by target type', async () => {
      const mockData = [{ id: '1', target_type: 'product', target_id: 'p1', target_name: 'Product 1', discount_type: 'percentage', discount_value: 15, start_date: '2026-06-01', end_date: '2026-06-30', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' }]
      mockDb.query.mockResolvedValueOnce({ rows: mockData, command: { rowCount: 1 } })
      mockDb.query.mockResolvedValueOnce({ rows: [{ count: '1' }] })

      await service.listPromotions({ targetType: 'product', limit: 10 })

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('target_type = $1'),
        expect.any(Array)
      )
    })

    it('should filter by active status', async () => {
      const mockData = [{ id: '1', target_type: 'product', target_id: 'p1', target_name: 'Product 1', discount_type: 'percentage', discount_value: 15, start_date: '2026-06-01', end_date: '2026-06-30', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' }]
      mockDb.query.mockResolvedValueOnce({ rows: mockData, command: { rowCount: 1 } })
      mockDb.query.mockResolvedValueOnce({ rows: [{ count: '1' }] })

      await service.listPromotions({ isActive: true, limit: 10 })

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('is_active = $1'),
        expect.any(Array)
      )
    })
  })

  describe('createPromotion', () => {
    it('should create a new promotion', async () => {
      const mockResult = { id: '1', target_type: 'product', target_id: 'p1', target_name: 'Product 1', discount_type: 'percentage', discount_value: 15, start_date: '2026-06-01', end_date: '2026-06-30', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' }
      mockDb.query.mockResolvedValueOnce({ rows: [mockResult], command: { rowCount: 1 } })

      const result = await service.createPromotion({
        targetType: 'product',
        targetId: 'p1',
        targetName: 'Product 1',
        discountType: 'percentage',
        discountValue: 15,
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        isActive: true,
      })

      expect(result.id).toBeDefined()
      expect(result.targetType).toBe('product')
      expect(result.discountValue).toBe(15)
    })
  })

  describe('getPromotion', () => {
    it('should return a promotion by id', async () => {
      const mockResult = { id: '1', target_type: 'product', target_id: 'p1', target_name: 'Product 1', discount_type: 'percentage', discount_value: 15, start_date: '2026-06-01', end_date: '2026-06-30', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' }
      mockDb.query.mockResolvedValueOnce({ rows: [mockResult] })

      const result = await service.getPromotion('1')

      expect(result).toBeDefined()
      expect(result?.id).toBe('1')
    })

    it('should return null if promotion not found', async () => {
      mockDb.query.mockResolvedValueOnce({ rows: [] })

      const result = await service.getPromotion('999')

      expect(result).toBeNull()
    })
  })

  describe('deletePromotion', () => {
    it('should delete a promotion', async () => {
      mockDb.query.mockResolvedValueOnce({ command: { rowCount: 1 } })

      await service.deletePromotion('1')

      expect(mockDb.query).toHaveBeenCalledWith('DELETE FROM promotions WHERE id = $1', ['1'])
    })
  })
})
