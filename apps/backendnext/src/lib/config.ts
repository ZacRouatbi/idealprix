import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env') })

export const DB_HOST = process.env.DB_HOST || 'localhost'
export const DB_PORT = parseInt(process.env.DB_PORT || '5432')
export const DB_USER = process.env.DB_USER || 'postgres'
export const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres'
export const DB_NAME = process.env.DB_NAME || 'idealprix'
export const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export const DATABASE_URL = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`