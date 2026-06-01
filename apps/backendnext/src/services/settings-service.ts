import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export interface Settings {
  id?: string
  user_id?: string
  language: 'en' | 'fr'
  currency: string
  timezone: string
  updated_at?: string
}

export class SettingsService {
  async getSettings(userId?: string): Promise<Settings> {
    const result = await db.query(
      'SELECT * FROM settings WHERE user_id = $1 OR user_id IS NULL ORDER BY user_id NULLS FIRST LIMIT 1',
      [userId || null]
    )
    
    if (result.rows.length > 0) {
      return result.rows[0] as Settings
    }
    
    return {
      language: 'en',
      currency: 'tnd',
      timezone: 'africa/tunis',
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId])
    
    if (result.rows.length === 0) {
      throw new Error('User not found')
    }

    const user = result.rows[0]
    
    const isValid = await bcrypt.compare(currentPassword, user.password_hash)
    if (!isValid) {
      throw new Error('Current password is incorrect')
    }
    
    const newPasswordHash = await bcrypt.hash(newPassword, 10)
    
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    )
    
    return true
  }
}

export const settingsService = new SettingsService()