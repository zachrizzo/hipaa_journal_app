'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface UseRoleBasedAuthProps {
  requiredRole: 'CLIENT' | 'PROVIDER' | 'ADMIN'
  redirectOnWrongRole?: boolean
}

export function useRoleBasedAuth({ requiredRole, redirectOnWrongRole = true }: UseRoleBasedAuthProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    if (redirectOnWrongRole && session.user.role !== requiredRole) {
      // Redirect to appropriate dashboard based on role
      switch (session.user.role) {
        case 'ADMIN':
          router.push('/admin')
          break
        case 'PROVIDER':
          router.push('/provider')
          break
        case 'CLIENT':
          router.push('/client')
          break
        default:
          break
      }
    }
  }, [session, status, router, requiredRole, redirectOnWrongRole])

  const handleSignOut = async (): Promise<void> => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  const isLoading = status === 'loading'
  const isAuthenticated = !!session
  const hasCorrectRole = session?.user?.role === requiredRole

  return {
    session,
    status,
    isLoading,
    isAuthenticated,
    hasCorrectRole,
    handleSignOut
  }
}