import { NextRequest, NextResponse } from 'next/server'
import { clientService } from '@/services/client-service'
import { verifyTokenFromRequest } from '@/lib/auth-middleware'

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

export async function GET(request: NextRequest) {
  const authError = await checkAuth(request)
  if (authError) return authError

  const searchParams = request.nextUrl.searchParams
  const filters = {
    limit: parseInt(searchParams.get('limit') || '50'),
    offset: parseInt(searchParams.get('offset') || '0'),
    search: searchParams.get('search') || undefined,
  }

  try {
    const clients = await clientService.listClients(filters)
    return NextResponse.json(clients)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}