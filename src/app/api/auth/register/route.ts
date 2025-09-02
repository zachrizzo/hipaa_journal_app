import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { db } from '@/lib/db'
import { createAuditLog, getAuditContext } from '@/lib/security/audit'
import type { ApiResponse } from '@/types/api'
import type { UserRole, User } from '@/types/database'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(12, 'Password must be at least 12 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['CLIENT', 'PROVIDER']).optional()
})

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Pick<User, 'id'>>>> {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists with this email' },
        { status: 400 }
      )
    }

    const hashedPassword = await hash(validatedData.password, 12)
    const role: UserRole = validatedData.role || 'CLIENT'

    const user = await db.user.create({
      data: {
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        hashedPassword,
        role,
        emailVerified: new Date() // In production, implement email verification
      }
    })

    // Audit user creation
    const context = getAuditContext(request, user.id)
    await createAuditLog(
      {
        action: 'CREATE',
        resource: 'users',
        resourceId: user.id,
        details: { email: user.email, role: user.role }
      },
      context
    )

    return NextResponse.json(
      { success: true, data: { id: user.id }, message: 'User created successfully' },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0]?.message || 'Validation error' },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}