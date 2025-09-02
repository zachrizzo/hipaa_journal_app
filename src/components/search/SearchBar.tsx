'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Filter } from 'lucide-react'

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: 'all' | 'DRAFT' | 'PUBLISHED'
  onStatusFilterChange: (status: 'all' | 'DRAFT' | 'PUBLISHED') => void
  statusOptions?: Array<{ value: string; label: string }>
  placeholder?: string
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'PUBLISHED', label: 'Published' }
  ],
  placeholder = 'Search entries...'
}: SearchBarProps) {
  return (
    <Card className='shadow-lg border-0 bg-white/90 backdrop-blur-sm mb-8'>
      <CardContent className='p-6'>
        <div className='flex flex-col sm:flex-row gap-4 items-stretch sm:items-center'>
          <div className='flex-1'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
              <Input
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className='pl-10 h-11'
              />
            </div>
          </div>
          <div className='flex items-center space-x-3 sm:flex-shrink-0'>
            <Filter className='w-4 h-4 text-muted-foreground' />
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className='w-36 h-11'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}