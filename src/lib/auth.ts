import { NextAuthOptions, User as NextAuthUser } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { db } from '@/lib/db'
import { createAuditLog, getAuditContext } from '@/lib/security/audit'
import type { UserRole } from '@/types/database'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
    role: UserRole
  }

  interface Session {
    user: {
      id: string
      email: string
      firstName: string | null
      lastName: string | null
      role: UserRole
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    email?: string | null
    firstName?: string | null
    lastName?: string | null
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, req): Promise<NextAuthUser | null> {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user || !user.hashedPassword || !user.isActive) {
            return null
          }

          // Check if account is locked
          if (user.lockedUntil && user.lockedUntil > new Date()) {
            return null
          }

          const isPasswordValid = await compare(credentials.password, user.hashedPassword)

          if (!isPasswordValid) {
            // Increment login attempts
            await db.user.update({
              where: { id: user.id },
              data: {
                loginAttempts: user.loginAttempts + 1,
                lockedUntil: user.loginAttempts >= 4 ? 
                  new Date(Date.now() + 15 * 60 * 1000) : // 15 minutes
                  undefined
              }
            })

            // Audit failed login attempt
            if (req) {
              const context = getAuditContext(req as unknown as Request, user.id)
              await createAuditLog(
                {
                  action: 'LOGIN',
                  resource: 'users',
                  resourceId: user.id,
                  details: { success: false, reason: 'invalid_password' }
                },
                context
              )
            }

            return null
          }

          // Reset login attempts on successful login
          await db.user.update({
            where: { id: user.id },
            data: {
              loginAttempts: 0,
              lockedUntil: null,
              lastLoginAt: new Date()
            }
          })

          // Audit successful login
          if (req) {
            const context = getAuditContext(req as unknown as Request, user.id)
            await createAuditLog(
              {
                action: 'LOGIN',
                resource: 'users',
                resourceId: user.id,
                details: { success: true }
              },
              context
            )
          }

          return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
          }
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 15 * 60, // 15 minutes
    updateAge: 5 * 60 // Update every 5 minutes
  },
  jwt: {
    maxAge: 15 * 60 // 15 minutes
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.email = user.email
        token.firstName = user.firstName
        token.lastName = user.lastName
      }

      // Validate user still exists and is active
      if (token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { isActive: true, role: true }
        })

        if (!dbUser?.isActive) {
          throw new Error('User account is inactive')
        }

        token.role = dbUser.role
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role
        session.user.email = (token.email as string) ?? session.user.email
        session.user.firstName = (token.firstName as string | null) ?? null
        session.user.lastName = (token.lastName as string | null) ?? null
      }
      return session
    },
    async signIn() {
      return true
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  events: {
    async signOut({ token }) {
      if (token?.id) {
        // Audit logout
        const context = {
          userId: token.id as string,
          ipAddress: 'unknown',
          userAgent: 'unknown'
        }

        await createAuditLog(
          {
            action: 'LOGOUT',
            resource: 'users',
            resourceId: token.id as string,
            details: { success: true }
          },
          context
        )

        // Invalidate all sessions for the user
        await db.session.updateMany({
          where: { userId: token.id as string },
          data: { isActive: false }
        })
      }
    }
  },
  debug: process.env.NODE_ENV === 'development'
}