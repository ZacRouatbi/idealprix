import { db } from '@/lib/db'

export interface AuditLog {
  id: string
  user_id?: string
  action: string
  table_name?: string
  record_id?: string
  old_values?: any
  new_values?: any
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface Activity {
  id: string
  type: 'order' | 'product' | 'user' | 'inventory' | 'system'
  message: string
  timestamp: string
  status?: 'success' | 'warning' | 'error'
}

export class AuditService {
  async getRecentActivities(limit: number = 8): Promise<Activity[]> {
    const result = await db.query(
      `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1`,
      [limit]
    )

    return result.rows.map((log: AuditLog) => ({
      id: log.id,
      type: this.getActionType(log.action, log.table_name),
      message: this.formatMessage(log),
      timestamp: log.created_at,
      status: 'success' as const,
    }))
  }

  async logAction(data: {
    userId?: string
    action: string
    tableName?: string
    recordId?: string
    oldValues?: any
    newValues?: any
    ipAddress?: string
    userAgent?: string
  }): Promise<void> {
    await db.query(
      `INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        data.userId,
        data.action,
        data.tableName,
        data.recordId,
        data.oldValues,
        data.newValues,
        data.ipAddress,
        data.userAgent,
      ]
    )
  }

  private getActionType(action: string, tableName?: string): Activity['type'] {
    if (tableName === 'orders') return 'order'
    if (tableName === 'products') return 'product'
    if (tableName === 'users') return 'user'
    if (tableName === 'inventory') return 'inventory'
    return 'system'
  }

  private formatMessage(log: AuditLog): string {
    const action = log.action.toLowerCase()
    const table = log.table_name?.toLowerCase() || ''
    
    if (action.includes('create')) {
      return `New ${table.slice(0, -1) || 'record'} created`
    }
    if (action.includes('update')) {
      return `${table.charAt(0).toUpperCase() + table.slice(1)} updated`
    }
    if (action.includes('delete')) {
      return `${table.charAt(0).toUpperCase() + table.slice(1)} deleted`
    }
    return action
  }
}

export const auditService = new AuditService()