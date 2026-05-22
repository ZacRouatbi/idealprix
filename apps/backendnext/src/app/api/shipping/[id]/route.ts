import { NextRequest, NextResponse } from 'next/server'
import { verifyTokenFromRequest } from '@/lib/auth-middleware'
import { db } from '@/lib/db'

async function checkAuth(request: NextRequest) {
  const user = await verifyTokenFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!['admin', 'manager'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkAuth(request)
  if (authError) return authError

  const { id } = await params
  try {
    await db.query(
      'DELETE FROM shipping_providers WHERE id = $1',
      [id]
    )
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkAuth(request)
  if (authError) return authError

  const { id } = await params
  try {
    const { name, phone, price, service_type, is_active } = await request.json()
    
    const result = await db.query(
      `UPDATE shipping_providers 
       SET name = $1, phone = $2, price = $3, service_type = $4, is_active = $5 
       WHERE id = $6 RETURNING *`,
      [name, phone || null, price, service_type, is_active ?? true, id]
    )
    
    return NextResponse.json(result.rows[0])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}