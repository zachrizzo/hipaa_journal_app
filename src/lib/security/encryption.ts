import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-for-development-only-32'
const DATA_ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || 'default-data-key-for-dev-only-32'

if (ENCRYPTION_KEY.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be exactly 32 characters long')
}

if (DATA_ENCRYPTION_KEY.length !== 32) {
  throw new Error('DATA_ENCRYPTION_KEY must be exactly 32 characters long')
}

const ALGORITHM = 'aes-256-cbc'

export function encrypt(text: string, useDataKey = false): string {
  const key = useDataKey ? DATA_ENCRYPTION_KEY : ENCRYPTION_KEY
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  cipher.update(text, 'utf8', 'hex')
  const encrypted = cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

export function decrypt(text: string, useDataKey = false): string {
  const key = useDataKey ? DATA_ENCRYPTION_KEY : ENCRYPTION_KEY
  const textParts = text.split(':')
  const iv = Buffer.from(textParts.shift()!, 'hex')
  const encryptedText = textParts.join(':')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.update(encryptedText, 'hex', 'utf8')
  return decipher.final('utf8')
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