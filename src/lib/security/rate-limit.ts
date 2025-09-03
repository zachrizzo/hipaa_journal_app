import { LRUCache } from 'lru-cache'
import type { NextRequest } from 'next/server'

interface RateLimitOptions {
  // Number of requests allowed
  max: number
  // Time window in milliseconds  
  windowMs: number
  // Optional custom key generator
  keyGenerator?: (req: NextRequest) => string
}

interface RateLimitInfo {
  count: number
  resetTime: number
}

// Create separate caches for different endpoints
const caches = new Map<string, LRUCache<string, RateLimitInfo>>()

function getCache(namespace: string, maxSize: number = 500): LRUCache<string, RateLimitInfo> {
  if (!caches.has(namespace)) {
    caches.set(namespace, new LRUCache<string, RateLimitInfo>({
      max: maxSize,
      ttl: 15 * 60 * 1000, // 15 minutes TTL
    }))
  }
  return caches.get(namespace)!
}

/**
 * Simple rate limiting middleware for API routes
 * Uses in-memory LRU cache (resets on server restart)
 * For production, consider Redis or database-backed solution
 */
export async function rateLimit(
  req: NextRequest,
  options: RateLimitOptions,
  namespace: string = 'default',
  customKeyGenerator?: (req: NextRequest) => string
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const cache = getCache(namespace)
  
  // Generate key based on IP or session
  const defaultKeyGen = (request: NextRequest): string => {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1'
    return `${namespace}:${ip}`
  }
  
  const key = customKeyGenerator ? customKeyGenerator(req) : options.keyGenerator ? options.keyGenerator(req) : defaultKeyGen(req)
  const now = Date.now()
  
  // Get current rate limit info
  let info = cache.get(key)
  
  // Reset if window expired
  if (!info || now > info.resetTime) {
    info = {
      count: 0,
      resetTime: now + options.windowMs
    }
  }
  
  // Increment count
  info.count++
  
  // Update cache
  cache.set(key, info)
  
  // Check if limit exceeded
  const allowed = info.count <= options.max
  const remaining = Math.max(0, options.max - info.count)
  
  return {
    allowed,
    remaining,
    resetTime: info.resetTime
  }
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Individual summary generation: 10 requests per minute per user
  summaryGeneration: {
    max: 10,
    windowMs: 60 * 1000,
  },
  
  // Combined summary: 5 requests per 5 minutes per user  
  combinedSummary: {
    max: 5,
    windowMs: 5 * 60 * 1000,
  },
  
  // General API: 100 requests per minute per IP
  general: {
    max: 100,
    windowMs: 60 * 1000,
  },
  
  // Auth endpoints: 5 attempts per 15 minutes
  auth: {
    max: 5,
    windowMs: 15 * 60 * 1000,
  }
}