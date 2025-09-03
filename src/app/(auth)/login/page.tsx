'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
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
import { FileText, Mail, Lock, AlertCircle, Loader2, User, Stethoscope } from 'lucide-react'
import { LoginRequestParams } from '@/types/api'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

export default function LoginPage(): React.JSX.Element {
  const [form, setForm] = useState<LoginRequestParams>({ email: '', password: '' })
  const [errors, setErrors] = useState<Partial<LoginRequestParams>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})
    setLoginError('')

    try {
      const validatedData = loginSchema.parse(form)
      
      const result = await signIn('credentials', {
        email: validatedData.email,
        password: validatedData.password,
        redirect: false
      })

      if (result?.error) {
        setLoginError('Invalid email or password')
        setIsLoading(false)
        return
      }

      if (result?.ok) {
        const session = await getSession()
        if (session?.user?.role) {
          switch (session.user.role) {
            case 'PROVIDER':
              router.push('/provider')
              break
            case 'CLIENT':
            default:
              router.push('/client')
              break
          }
        } else {
          router.push('/client')
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<LoginRequestParams> = {}
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof LoginRequestParams] = err.message
          }
        })
        setErrors(fieldErrors)
      }
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof LoginRequestParams) => (e: React.ChangeEvent<HTMLInputElement>): void => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleQuickLogin = async (email: string, password: string): Promise<void> => {
    setIsLoading(true)
    setErrors({})
    setLoginError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      if (result?.error) {
        setLoginError('Quick login failed - user may not exist')
        setIsLoading(false)
        return
      }

      if (result?.ok) {
        const session = await getSession()
        if (session?.user?.role) {
          switch (session.user.role) {
            case 'PROVIDER':
              router.push('/provider')
              break
            case 'CLIENT':
            default:
              router.push('/client')
              break
          }
        } else {
          router.push('/client')
        }
      }
    } catch (error) {
      setLoginError('Quick login failed')
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8'>
      {/* Background Pattern */}
      <div className='absolute inset-0 bg-grid-slate-100 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] opacity-20' />
      
      <Card className='w-full max-w-md relative z-10 shadow-2xl border-0 bg-white/95 backdrop-blur-sm'>
        <CardHeader className='text-center pb-6 pt-8'>
          <div className='mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg'>
            <FileText className='w-8 h-8 text-white' />
          </div>
          <Heading as='h1' size='2xl' variant='gradient'>
            HIPAA Journal
          </Heading>
          <CardDescription className='mt-2'>
            Secure journaling for healthcare professionals and clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email address</Label>
              <InputWithIcon
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                required
                placeholder='Enter your email'
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
                autoComplete='current-password'
                required
                placeholder='Enter your password'
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

            {loginError && (
              <Alert variant="destructive">
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>{loginError}</AlertDescription>
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
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>

            <Text as='div' className='text-center'>
              <Text size='sm' variant='muted'>
                Don&apos;t have an account?{' '}
                <Link href='/register' className='text-primary hover:underline font-medium transition-colors duration-200'>
                  Create account
                </Link>
              </Text>
            </Text>
          </form>

          {/* Quick Login Buttons for Testing */}
          <Text as='div' className='mt-8 pt-6 border-t'>
            <Text size='xs' variant='muted' align='center' weight='medium' className='mb-4'>
              🚀 Quick Login for Testing:
            </Text>
            <div className='space-y-3'>
              <Button
                variant="outline-primary"
                size="sm"
                className='w-full'
                disabled={isLoading}
                onClick={() => handleQuickLogin('john.doe.client@example.com', 'password123!')}
              >
                <User className='w-4 h-4 mr-2' />
                Login as Client (John Doe)
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                className='w-full'
                disabled={isLoading}
                onClick={() => handleQuickLogin('dr.sarah.provider@example.com', 'password123!')}
              >
                <Stethoscope className='w-4 h-4 mr-2' />
                Login as Provider (Dr. Sarah)
              </Button>
            </div>
            <Text size='xs' variant='muted' align='center' leading='relaxed' className='mt-3'>
              Use these buttons to quickly test the application with different user roles.
            </Text>
          </Text>
        </CardContent>
      </Card>
    </div>
  )
}