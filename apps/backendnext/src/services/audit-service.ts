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
    try {
      const result = await db.query(
        `SELECT id, user_id, action, table_name, record_id, 
                old_values, new_values, ip_address, user_agent, created_at
         FROM audit_logs 
         ORDER BY created_at DESC LIMIT $1`,
        [limit]
      )

      const activities = result.rows.map((log: any) => ({
        id: log.id,
        type: this.getActionType(log.action, log.table_name),
        message: this.formatMessage(log),
        timestamp: log.created_at,
        status: this.getActionStatus(log.action),
      }))

      if (activities.length > 0) {
        return activities
      }

      return await this.generateSyntheticActivities(limit)
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      return []
    }
  }

  private async generateSyntheticActivities(limit: number): Promise<Activity[]> {
    const syntheticActivities: Activity[] = []

    const orderResult = await db.query(
      `SELECT id, order_number, created_at, status FROM orders ORDER BY created_at DESC LIMIT 3`,
    )

    for (const order of orderResult.rows as any[]) {
      syntheticActivities.push({
        id: `order-${order.id}`,
        type: 'order',
        message: `Order #${order.order_number} ${order.status}`,
        timestamp: order.created_at,
        status: 'success',
      })
    }

    const productResult = await db.query(
      `SELECT id, name, created_at FROM products ORDER BY created_at DESC LIMIT 3`,
    )

    for (const product of productResult.rows as any[]) {
      syntheticActivities.push({
        id: `product-${product.id}`,
        type: 'product',
        message: `Product "${product.name}" available`,
        timestamp: product.created_at,
        status: 'success',
      })
    }

    const inventoryResult = await db.query(
      `SELECT i.product_id, i.last_updated, p.name, (i.quantity - i.reserved_quantity) as available
       FROM inventory i JOIN products p ON i.product_id = p.id ORDER BY i.last_updated DESC LIMIT 2`,
    )

    for (const item of inventoryResult.rows as any[]) {
      syntheticActivities.push({
        id: `inventory-${item.product_id}`,
        type: 'inventory',
        message: `${item.available} units of "${item.name}" in stock`,
        timestamp: item.last_updated,
        status: item.available > 10 ? 'success' : 'warning',
      })
    }

    return syntheticActivities.slice(0, limit).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
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
    const recordId = log.record_id?.substring(0, 8) || 'N/A'

    if (table === 'orders') {
      if (action.includes('create')) return `Order #${recordId} created`
      if (action.includes('update')) return `Order #${recordId} updated`
      if (action.includes('delete')) return `Order #${recordId} deleted`
      return `Order #${recordId} - ${action}`
    }

    if (table === 'products') {
      if (action.includes('create')) return `Product record created`
      if (action.includes('update')) return `Product record updated`
      if (action.includes('delete')) return `Product record deleted`
      return `Product action - ${action}`
    }

    if (table === 'users') {
      if (action.includes('create')) return `New user registered`
      if (action.includes('update')) return `User settings updated`
      if (action.includes('delete')) return `User removed`
      return `User action - ${action}`
    }

    if (table === 'inventory') {
      if (action.includes('create')) return `Inventory item created`
      if (action.includes('update')) return `Inventory updated`
      if (action.includes('delete')) return `Inventory removed`
      return `Inventory action - ${action}`
    }

    if (action.includes('create')) {
      return `New ${table.slice(0, -1) || 'record'} created`
    }
    if (action.includes('update')) {
      return `${table.charAt(0).toUpperCase() + table.slice(1)} updated`
    }
    if (action.includes('delete')) {
      return `${table.charAt(0).toUpperCase() + table.slice(1)} deleted`
    }
    return log.action
  }

  private getActionStatus(action: string): Activity['status'] {
    const actionLower = action.toLowerCase()
    if (actionLower.includes('delete') || actionLower.includes('cancel')) return 'error'
    if (actionLower.includes('update') || actionLower.includes('refund')) return 'warning'
    return 'success'
  }
}

export const auditService = new AuditService()