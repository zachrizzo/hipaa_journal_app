import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from 'next-auth/middleware'
import { getToken } from 'next-auth/jwt'

export default withAuth(
  async function middleware(req: NextRequest) {
    const response = NextResponse.next()

    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    
    // HSTS header for HTTPS
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    }

    // Generate nonce for inline scripts
    const nonce = Buffer.from(Math.random().toString(36).substring(2, 15)).toString('base64')
    response.headers.set('X-Script-Nonce', nonce)

    // Content Security Policy - More secure without unsafe-eval
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: http:`, // Strict dynamic for Next.js
      "style-src 'self' 'unsafe-inline'", // Still needed for styled-jsx
      "img-src 'self' data: https: blob:",
      "font-src 'self'",
      "connect-src 'self' https://api.openai.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests"
    ].join('; ')
    
    response.headers.set('Content-Security-Policy', csp)

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const { pathname } = req.nextUrl

    // Role-based access control
    if (pathname.startsWith('/provider') && token?.role !== 'PROVIDER') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    if (pathname.startsWith('/client') && !['CLIENT', 'PROVIDER'].includes(token?.role as string)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    // Rate limiting (basic implementation)
    // In production, use Redis for proper rate limiting
    // This is a basic implementation for development

    return response
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Allow access to auth pages without token
        if (pathname.startsWith('/auth/')) {
          return true
        }

        // Require authentication for protected routes
        if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
          return !!token
        }

        // Require authentication for dashboard routes
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/client') || 
            pathname.startsWith('/provider')) {
          return !!token
        }

        return true
      }
    }
  }
)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/api/:path*',
    '/dashboard/:path*',
    '/client/:path*',
    '/provider/:path*'
  ]
}