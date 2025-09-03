'use client'

import Link from 'next/link'
import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionText?: string
  actionHref?: string
  onAction?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  actionHref,
  onAction
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <Text as="h3" size="lg" weight="semibold" className="mb-2">{title}</Text>
      <Text as="p" size="lg" weight="normal" className="text-muted-foreground text-center max-w-md mb-6">
        {description}
      </Text>
      {actionText && (actionHref || onAction) && (
        <>
          {actionHref ? (
            <Link href={actionHref}>
              <Button>{actionText}</Button>
            </Link>
          ) : (
            <Button onClick={onAction}>{actionText}</Button>
          )}
        </>
      )}
    </div>
  )
}