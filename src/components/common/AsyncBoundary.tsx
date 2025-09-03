'use client'

import { ReactNode } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AsyncBoundaryProps {
  isLoading: boolean
  error?: Error | string | null
  loadingMessage?: string
  children: ReactNode
}

export function AsyncBoundary({ 
  isLoading, 
  error, 
  loadingMessage = 'Loading...',
  children 
}: AsyncBoundaryProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">{loadingMessage}</span>
      </div>
    )
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : error
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    )
  }

  return <>{children}</>
}