import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getAvailableProviders } from '@/lib/db/shares'
import type { ApiResponse } from '@/types/api'

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Array<{ id: string; name: string | null; email: string; role: string }>>>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only clients can get list of available providers to share with
    if (session.user.role !== 'CLIENT') {
      return NextResponse.json(
        { success: false, error: 'Only clients can view available providers' },
        { status: 403 }
      )
    }

    const providers = await getAvailableProviders(session.user.id)

    return NextResponse.json({
      success: true,
      data: providers
    })
  } catch (error) {
    console.error('Error fetching available providers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch providers' },
      { status: 500 }
    )
  }
}