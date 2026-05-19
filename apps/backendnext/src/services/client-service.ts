import { db } from '@/lib/db'
import { PaginatedResponse, FilterParams } from '@/types'

export interface Client {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
  last_login?: string
}

export class ClientService {
  async listClients(filters?: FilterParams): Promise<PaginatedResponse<Client>> {
    let query = 'SELECT * FROM users WHERE role = $1'
    const params: any[] = ['customer']
    let paramIndex = 2

    if (filters?.search) {
      query += ` AND (email ILIKE $${paramIndex++} OR first_name ILIKE $${paramIndex++} OR last_name ILIKE $${paramIndex++})`
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`)
    }

    query += ` ORDER BY created_at DESC LIMIT ${filters?.limit || 50} OFFSET ${filters?.offset || 0}`

    const result = await db.query(query, params)
    
    const countResult = await db.query(
      'SELECT COUNT(*) FROM users WHERE role = $1' + (filters?.search ? ` AND (email ILIKE $2 OR first_name ILIKE $3 OR last_name ILIKE $4)` : ''),
      filters?.search ? [params[0], ...params.slice(1)] : [params[0]]
    )

    return {
      data: result.rows as Client[],
      count: parseInt(countResult.rows[0].count),
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
      page: Math.floor((filters?.offset || 0) / (filters?.limit || 50)) + 1,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / (filters?.limit || 50)),
    }
  }
}

export const clientService = new ClientService()