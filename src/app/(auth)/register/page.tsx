'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { InputWithIcon } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Text } from '@/components/ui/text'
import { Heading } from '@/components/ui/heading'
import { UserPlus, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react'

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(12, 'Password must be at least 12 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

interface RegisterForm {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

export default function RegisterPage(): React.JSX.Element {
  const [form, setForm] = useState<RegisterForm>({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  })
  const [errors, setErrors] = useState<Partial<RegisterForm>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [registerError, setRegisterError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})
    setRegisterError('')
    setSuccessMessage('')

    try {
      const validatedData = registerSchema.parse(form)
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          password: validatedData.password
        })
      })

      const result = await response.json()

      if (!response.ok) {
        setRegisterError(result.error || 'Registration failed')
        setIsLoading(false)
        return
      }

      if (result.success) {
        setSuccessMessage('Registration successful! Redirecting to login...')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<RegisterForm> = {}
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof RegisterForm] = err.message
          }
        })
        setErrors(fieldErrors)
      } else {
        setRegisterError('An unexpected error occurred')
      }
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof RegisterForm) => (e: React.ChangeEvent<HTMLInputElement>): void => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8'>
      {/* Background Pattern */}
      <div className='absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] opacity-20' />
      
      <Card className='w-full max-w-md relative z-10 shadow-2xl border-0 bg-white/95 backdrop-blur-sm'>
        <CardHeader className='text-center pb-6 pt-8'>
          <div className='mx-auto w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg'>
            <UserPlus className='w-8 h-8 text-white' />
          </div>
          <Heading as='h1' size='2xl' variant='gradient'>
            Create Account
          </Heading>
          <CardDescription className='mt-2'>
            Join HIPAA Journal - Secure journaling for healthcare professionals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='flex space-x-4'>
              <div className='flex-1 space-y-2'>
                <Label htmlFor='firstName'>First Name</Label>
                <InputWithIcon
                  id='firstName'
                  name='firstName'
                  type='text'
                  autoComplete='given-name'
                  required
                  placeholder='First Name'
                  value={form.firstName}
                  onChange={handleChange('firstName')}
                  disabled={isLoading}
                  icon={<User className='w-5 h-5' />}
                />
                {errors.firstName && (
                  <Text variant='destructive' size='sm' className='flex items-center mt-1'>
                    <AlertCircle className='w-4 h-4 mr-1' />
                    {errors.firstName}
                  </Text>
                )}
              </div>
              <div className='flex-1 space-y-2'>
                <Label htmlFor='lastName'>Last Name</Label>
                <InputWithIcon
                  id='lastName'
                  name='lastName'
                  type='text'
                  autoComplete='family-name'
                  required
                  placeholder='Last Name'
                  value={form.lastName}
                  onChange={handleChange('lastName')}
                  disabled={isLoading}
                  icon={<User className='w-5 h-5' />}
                />
                {errors.lastName && (
                  <Text variant='destructive' size='sm' className='flex items-center mt-1'>
                    <AlertCircle className='w-4 h-4 mr-1' />
                    {errors.lastName}
                  </Text>
                )}
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email address</Label>
              <InputWithIcon
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                required
                placeholder='Email address'
                value={form.email}
                onChange={handleChange('email')}
                disabled={isLoading}
                icon={<Mail className='w-5 h-5' />}
              />
              {errors.email && (
                <Text variant='destructive' size='sm' className='flex items-center mt-1'>
                  <AlertCircle className='w-4 h-4 mr-1' />
                  {errors.email}
                </Text>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <InputWithIcon
                id='password'
                name='password'
                type='password'
                autoComplete='new-password'
                required
                placeholder='Password'
                value={form.password}
                onChange={handleChange('password')}
                disabled={isLoading}
                icon={<Lock className='w-5 h-5' />}
              />
              {errors.password && (
                <Text variant='destructive' size='sm' className='flex items-center mt-1'>
                  <AlertCircle className='w-4 h-4 mr-1' />
                  {errors.password}
                </Text>
              )}
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Confirm Password</Label>
              <InputWithIcon
                id='confirmPassword'
                name='confirmPassword'
                type='password'
                autoComplete='new-password'
                required
                placeholder='Confirm Password'
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                disabled={isLoading}
                icon={<Lock className='w-5 h-5' />}
              />
              {errors.confirmPassword && (
                <Text variant='destructive' size='sm' className='flex items-center mt-1'>
                  <AlertCircle className='w-4 h-4 mr-1' />
                  {errors.confirmPassword}
                </Text>
              )}
            </div>

            {registerError && (
              <Alert variant="destructive">
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>{registerError}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            <Button
              type='submit'
              disabled={isLoading}
              variant='gradient'
              size='lg'
              className='w-full'
            >
              {isLoading ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>

            <div className='text-center'>
              <Text size='sm' variant='muted'>
                Already have an account?{' '}
                <Link href='/login' className='text-primary hover:underline font-medium transition-colors duration-200'>
                  Sign in
                </Link>
              </Text>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}