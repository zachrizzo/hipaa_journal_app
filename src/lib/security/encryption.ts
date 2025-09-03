import crypto from 'crypto'

// In production, these MUST be set via environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-for-development-only-32'
const DATA_ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || 'default-data-key-for-dev-only-32'

// Validate keys in production
if (process.env.NODE_ENV === 'production') {
  if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY === 'default-key-for-development-only-32') {
    throw new Error('ENCRYPTION_KEY must be set in production environment')
  }
  if (!process.env.DATA_ENCRYPTION_KEY || process.env.DATA_ENCRYPTION_KEY === 'default-data-key-for-dev-only-32') {
    throw new Error('DATA_ENCRYPTION_KEY must be set in production environment')
  }
}

if (ENCRYPTION_KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be exactly 32 characters long')
}

if (DATA_ENCRYPTION_KEY.length !== 32) {
  throw new Error('DATA_ENCRYPTION_KEY must be exactly 32 characters long')
}

// Use AES-256-GCM for authenticated encryption
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16

export function encrypt(text: string, useDataKey = false): string {
  const key = Buffer.from(useDataKey ? DATA_ENCRYPTION_KEY : ENCRYPTION_KEY, 'utf8')
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  // Concatenate update and final for proper encryption
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final()
  ])
  
  // Get the authentication tag
  const authTag = cipher.getAuthTag()
  
  // Combine iv, authTag, and encrypted data
  const combined = Buffer.concat([iv, authTag, encrypted])
  
  return combined.toString('base64')
}

export function decrypt(text: string, useDataKey = false): string {
  const key = Buffer.from(useDataKey ? DATA_ENCRYPTION_KEY : ENCRYPTION_KEY, 'utf8')
  const combined = Buffer.from(text, 'base64')
  
  // Extract components
  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
  const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH)
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  // Concatenate update and final for proper decryption
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ])
  
  return decrypted.toString('utf8')
}

export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex')
}

export function generateSecureToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

export function generateMfaSecret(): string {
  return crypto.randomBytes(20).toString('hex')
}

export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  
  return result === 0
}