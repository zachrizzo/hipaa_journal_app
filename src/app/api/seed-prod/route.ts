import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { db } from '@/lib/db'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify secret token to prevent unauthorized seeding
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    if (token !== process.env.NEXTAUTH_SECRET?.slice(0, 10)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Seeding production database...')

    // Create provider user
    const providerUser = await db.user.upsert({
      where: { email: 'dr.sarah.provider@example.com' },
      update: {
        hashedPassword: await hash('SecurePass123!@#', 12),
        loginAttempts: 0,
        lockedUntil: null,
        isActive: true,
      },
      create: {
        email: 'dr.sarah.provider@example.com',
        firstName: 'Dr. Sarah',
        lastName: 'Provider',
        role: 'PROVIDER',
        hashedPassword: await hash('SecurePass123!@#', 12),
        isActive: true,
      }
    })

    // Create client user
    const clientUser = await db.user.upsert({
      where: { email: 'john.doe.client@example.com' },
      update: {
        hashedPassword: await hash('SecurePass123!@#', 12),
        loginAttempts: 0,
        lockedUntil: null,
        isActive: true,
      },
      create: {
        email: 'john.doe.client@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CLIENT',
        hashedPassword: await hash('SecurePass123!@#', 12),
        isActive: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Production database seeded successfully',
      users: [
        { email: providerUser.email, role: providerUser.role },
        { email: clientUser.email, role: clientUser.role }
      ]
    })
  } catch (error) {
    console.error('Seeding failed:', error)
    return NextResponse.json(
      { 
        error: 'Failed to seed database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}