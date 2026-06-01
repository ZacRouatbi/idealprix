import { NextRequest, NextResponse } from 'next/server'
import { settingsService } from '@/services/settings-service'
import { verifyTokenFromRequest } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  const user = await verifyTokenFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { currentPassword, newPassword } = await request.json()
    await settingsService.changePassword(user.id, currentPassword, newPassword)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to change password' }, { status: 500 })
  }
}