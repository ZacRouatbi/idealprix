import { db } from '@/lib/db'

export interface ShippingProvider {
  id: string
  name: string
  phone?: string
  price: number
  service_type: 'standard' | 'express' | 'pickup'
  is_active: boolean
}

export class ShippingService {
  async getActiveProviders(): Promise<ShippingProvider[]> {
    const result = await db.query(
      'SELECT id, name, phone, price, service_type FROM shipping_providers WHERE is_active = true ORDER BY price ASC',
      []
    )
    return result.rows as ShippingProvider[]
  }

  async getProviderById(id: string): Promise<ShippingProvider | null> {
    const result = await db.query(
      'SELECT * FROM shipping_providers WHERE id = $1 AND is_active = true',
      [id]
    )
    return result.rows[0] as ShippingProvider || null
  }
}

export const shippingService = new ShippingService()