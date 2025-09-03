'use client'

import { useState, useCallback } from 'react'
import { z } from 'zod'
import { RichTextEditor } from './RichTextEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Text } from '@/components/ui/text'
import type { CreateEntryInput, EntryStatus } from '@/types/database'

interface JournalEntryFormProps {
  onSubmit: (data: CreateEntryInput) => Promise<void>
  initialData?: Partial<CreateEntryInput>
  isSubmitting?: boolean
  className?: string
}

const journalEntrySchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  content: z.object({}).passthrough(),
  mood: z.number()
    .min(1, 'Mood must be between 1 and 10')
    .max(10, 'Mood must be between 1 and 10')
    .optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT')
})

export function JournalEntryForm({
  onSubmit,
  initialData,
  isSubmitting = false,
  className = ''
}: JournalEntryFormProps): React.JSX.Element {
  const [formData, setFormData] = useState<CreateEntryInput>({
    title: initialData?.title || '',
    content: initialData?.content || {},
    mood: initialData?.mood,
    tags: initialData?.tags ?? [],
    status: initialData?.status || 'DRAFT'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [tagInput, setTagInput] = useState('')

  const handleContentChange = useCallback((content: object) => {
    setFormData(prev => ({ ...prev, content }))
    if (errors.content) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { content, ...restErrors } = errors
      setErrors(restErrors)
    }
  }, [errors])

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const tag = tagInput.trim().toLowerCase()
      if (tag && !formData.tags?.includes(tag) && (formData.tags?.length ?? 0) < 10) {
        setFormData(prev => ({ ...prev, tags: [...(prev.tags ?? []), tag] }))
        setTagInput('')
      }
    }
  }

  const removeTag = (tagToRemove: string): void => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags ?? []).filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setErrors({})

    try {
      const validatedData = journalEntrySchema.parse(formData)
      await onSubmit(validatedData)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(fieldErrors)
      }
    }
  }

  const moodEmojis = ['😢', '😞', '😐', '😕', '😔', '😐', '🙂', '😊', '😄', '😁']
  const moodLabels = ['Terrible', 'Bad', 'Poor', 'Below Average', 'Average', 'Above Average', 'Good', 'Great', 'Excellent', 'Outstanding']

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Create Journal Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor='title'>
              Title *
            </Label>
            <Input
              type='text'
              id='title'
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder='Enter a title for your journal entry'
              disabled={isSubmitting}
              maxLength={200}
            />
            {errors.title && (
              <Text variant="destructive" size="sm">
                {errors.title}
              </Text>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label>
              Content *
            </Label>
            <RichTextEditor
              content={formData.content as object}
              onChange={handleContentChange}
              editable={!isSubmitting}
              placeholder='Write about your day, thoughts, feelings...'
            />
            {errors.content && (
              <Text variant="destructive" size="sm">
                {errors.content}
              </Text>
            )}
          </div>

          {/* Mood */}
          <div className="space-y-2">
            <Label>
              Mood (1-10)
            </Label>
            <div className='space-y-2'>
              <div className='flex items-center space-x-2'>
                <Input
                  type='range'
                  min='1'
                  max='10'
                  value={formData.mood || 5}
                  onChange={e => setFormData(prev => ({ ...prev, mood: parseInt(e.target.value) }))}
                  className='flex-1'
                  disabled={isSubmitting}
                  aria-label="Mood rating from 1 to 10"
                  aria-valuemin={1}
                  aria-valuemax={10}
                  aria-valuenow={formData.mood || 5}
                  aria-valuetext={`Mood: ${formData.mood || 5}/10 - ${moodLabels[(formData.mood || 5) - 1]}`}
                />
                <Text size="2xl" className="text-center">
                  {moodEmojis[(formData.mood || 5) - 1]}
                </Text>
                <Text size="sm" weight="medium" className="w-20 text-center">
                  {formData.mood || 5}/10
                </Text>
              </div>
              <Text variant="muted" size="xs">
                {moodLabels[(formData.mood || 5) - 1]}
              </Text>
            </div>
            {errors.mood && (
              <Text variant="destructive" size="sm">
                {errors.mood}
              </Text>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor='tags'>
              Tags
            </Label>
            <div className='space-y-2'>
              {(formData.tags?.length ?? 0) > 0 && (
                <div className='flex flex-wrap gap-2'>
                  {(formData.tags ?? []).map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => removeTag(tag)}
                    >
                      {tag}
                      <Text size="xs" className="ml-1">×</Text>
                    </Badge>
                  ))}
                </div>
              )}
              <Input
                type='text'
                id='tags'
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder='Add tags (press Enter or comma to add)'
                disabled={isSubmitting || (formData.tags?.length ?? 0) >= 10}
                maxLength={30}
              />
              <Text variant="muted" size="xs">
                Press Enter or comma to add a tag. Maximum 10 tags.
              </Text>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>
              Status
            </Label>
            <div className='flex space-x-4'>
              {(['DRAFT', 'PUBLISHED'] as EntryStatus[]).map(status => (
                <Label key={status} className='flex items-center'>
                  <Input
                    type='radio'
                    name='status'
                    value={status}
                    checked={formData.status === status}
                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as EntryStatus }))}
                    className='mr-2'
                    disabled={isSubmitting}
                    aria-describedby={`status-${status.toLowerCase()}-description`}
                  />
                  <Text size="sm" className="capitalize" id={`status-${status.toLowerCase()}-description`}>
                    {status.toLowerCase()}
                  </Text>
                </Label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className='flex justify-end space-x-3'>
            <Button
              type='submit'
              disabled={isSubmitting || !formData.title || !formData.content}
            >
              {isSubmitting ? 'Saving...' : 'Save Entry'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}