'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { ShieldX, ArrowLeft } from 'lucide-react'

export default function UnauthorizedPage(): React.JSX.Element {
  const router = useRouter()

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-12 px-4 sm:px-6 lg:px-8'>
      <Card className='w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm'>
        <CardHeader className='text-center pb-6 pt-8'>
          <div className='mx-auto w-16 h-16 bg-gradient-to-r from-red-600 to-orange-600 rounded-full flex items-center justify-center mb-4 shadow-lg'>
            <ShieldX className='w-8 h-8 text-white' />
          </div>
          <Heading as='h1' size='2xl' className='text-red-600'>
            Unauthorized Access
          </Heading>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='text-center space-y-2'>
            <Text as='p' variant='muted'>
              You don't have permission to access this resource.
            </Text>
            <Text as='p' size='sm' variant='muted'>
              Please contact your administrator if you believe this is an error.
            </Text>
          </div>
          
          <div className='flex flex-col space-y-3'>
            <Button
              onClick={() => router.back()}
              variant='outline'
              size='lg'
              className='w-full'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Go Back
            </Button>
            <Button
              onClick={() => router.push('/login')}
              variant='default'
              size='lg'
              className='w-full'
            >
              Return to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}