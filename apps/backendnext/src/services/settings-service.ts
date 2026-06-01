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
    
    // Return defaults
    return {
      language: 'en',
      currency: 'tnd',
      timezone: 'africa/tunis',
    }
  }

  async updateSettings(userId: string, data: Partial<Settings>): Promise<Settings> {
    const existing = await db.query('SELECT id FROM settings WHERE user_id = $1', [userId])
    
    if (existing.rows.length > 0) {
      const result = await db.query(
        `UPDATE settings SET 
          language = $1, 
          currency = $2, 
          timezone = $3, 
          updated_at = NOW() 
         WHERE user_id = $4 
         RETURNING *`,
        [data.language || 'en', data.currency || 'tnd', data.timezone || 'africa/tunis', userId]
      )
      return result.rows[0] as Settings
    } else {
      const result = await db.query(
        `INSERT INTO settings (id, user_id, language, currency, timezone) 
         VALUES (gen_random_uuid(), $1, $2, $3, $4) 
         RETURNING *`,
        [userId, data.language || 'en', data.currency || 'tnd', data.timezone || 'africa/tunis']
      )
      return result.rows[0] as Settings
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId])
    
    if (result.rows.length === 0) {
      throw new Error('User not found')
    }

    const user = result.rows[0]
    
    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash)
    if (!isValid) {
      throw new Error('Current password is incorrect')
    }
    
    // Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10)
    
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    )
    
    return true
  }
}

export const settingsService = new SettingsService()