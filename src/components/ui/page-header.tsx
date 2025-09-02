import { ReactNode } from 'react'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className='flex items-center justify-between mb-8'>
      <div>
        <Heading as='h1' size='3xl' variant='gradient' className='mb-2'>
          {title}
        </Heading>
        {description && (
          <Text size='lg' variant='muted'>
            {description}
          </Text>
        )}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  )
}