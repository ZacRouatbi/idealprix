import { Pool } from 'pg'

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  limit: number
  offset: number
  page: number
  totalPages: number
}

export interface FilterParams {
  search?: string
  limit?: number
  offset?: number
  order?: "ASC" | "DESC"
  expand?: string[]
  fields?: string[]
}

const pool = process.env.DATABASE_URL 
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'idealprix',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })

export default pool

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  getClient: () => pool.connect(),
}