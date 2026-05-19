import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchProducts, fetchCategories, login, fetchOrders } from '@/lib/data/backend-api'

// Mock the API client
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Backend API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('fetchProducts', () => {
    it('should fetch products with correct endpoint', async () => {
      const mockResponse = {
        data: [
          { id: '1', name: 'Product 1', slug: 'product-1', price: 1000, is_active: true, stock_quantity: 10 },
        ],
        count: 1,
        totalPages: 1
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await fetchProducts({ limit: 10 })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/public/products'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          credentials: 'include'
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      })

      await expect(fetchProducts()).rejects.toThrow('Server error')
    })

    it('should include credentials for cross-origin requests', async () => {
      const mockResponse = { data: [], count: 0, totalPages: 0 }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      await fetchProducts()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: 'include'
        })
      )
    })
  })

  describe('fetchCategories', () => {
    it('should fetch categories with correct endpoint', async () => {
      const mockResponse = {
        data: [
          { id: '1', name: 'Category 1', slug: 'category-1', is_active: true },
        ],
        count: 1,
        totalPages: 1
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await fetchCategories({ limit: 10 })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/public/categories'),
        expect.any(Object)
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('login', () => {
    it('should send login credentials correctly', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@example.com', role: 'customer' },
        token: 'test-token'
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await login('test@example.com', 'password123')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle invalid credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' }),
      })

      await expect(login('wrong@example.com', 'wrong')).rejects.toThrow('Invalid credentials')
    })
  })

  describe('Pagination', () => {
    it('should include pagination links in response', async () => {
      const mockResponse = {
        data: [{ id: '1', name: 'Product 1' }],
        count: 50,
        totalPages: 5,
        page: 1,
        limit: 10,
        offset: 0,
        links: {
          next: '/api/public/products?limit=10&offset=10',
          last: '/api/public/products?limit=10&offset=40'
        }
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await fetchProducts({ limit: 10, offset: 0 })
      
      expect(result).toHaveProperty('count')
      expect(result).toHaveProperty('totalPages')
      expect(result).toHaveProperty('page')
    })

    it('should handle large limit values with constraints', async () => {
      const mockResponse = {
        data: [],
        count: 0,
        totalPages: 0,
        page: 1,
        limit: 100,
        offset: 0
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      // Backend should cap limit at 100
      const result = await fetchProducts({ limit: 200 })
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=200'),
        expect.any(Object)
      )
    })
  })

  describe('fetchOrders', () => {
    it('should fetch orders with authentication', async () => {
      const mockResponse = {
        data: [{ id: '1', order_number: 'ORD-001', status: 'pending', total_amount: 100 }],
        count: 1,
        totalPages: 1
      }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await fetchOrders('test-token', { limit: 10 })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/orders'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token'
          })
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })
})