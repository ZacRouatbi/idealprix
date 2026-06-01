import { NextRequest, NextResponse } from 'next/server'
import { settingsService, Settings } from '@/services/settings-service'
import { verifyTokenFromRequest } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  const user = await verifyTokenFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const settings = await settingsService.getSettings(user.id)
    return NextResponse.json(settings)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const user = await verifyTokenFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    const settings = await settingsService.updateSettings(user.id, data)
    return NextResponse.json(settings)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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