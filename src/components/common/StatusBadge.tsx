'use client'

import { Badge } from '@/components/ui/badge'
import type { EntryStatus } from '@prisma/client'

interface StatusBadgeProps {
  status: EntryStatus
}

const statusConfig: Record<EntryStatus, { 
  label: string
  variant: 'default' | 'secondary' | 'outline' | 'destructive' 
}> = {
  PUBLISHED: { label: 'Published', variant: 'default' },
  DRAFT: { label: 'Draft', variant: 'secondary' },
  ARCHIVED: { label: 'Archived', variant: 'outline' }
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  )
}