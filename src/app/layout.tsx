import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'HIPAA Journal - Secure Healthcare Journaling',
  description: 'A secure, HIPAA-compliant journaling platform for healthcare professionals and clients',
  keywords: 'HIPAA, journal, healthcare, secure, privacy, mental health',
  authors: [{ name: 'HIPAA Journal Team' }],
  robots: 'noindex, nofollow', // Prevent search engine indexing for privacy
  viewport: 'width=device-width, initial-scale=1'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>): React.JSX.Element {
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <link rel='icon' href='/favicon.ico' />
      </head>
      <body className={`${inter.className} antialiased bg-gray-50 text-gray-900`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
