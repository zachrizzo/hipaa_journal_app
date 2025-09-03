# Production Authentication Fix Guide

## Issues Found

1. **Environment Variables Not Configured for Production**
   - `NEXTAUTH_URL` is set to localhost instead of production URL
   - `NEXTAUTH_SECRET` needs to be updated for production
   - Database connection might not be properly configured

2. **Password Validation Mismatch**
   - Registration API requires: 12+ characters, uppercase, lowercase, number, special character
   - Seed data uses: `password123!` (only 11 characters)
   - Quick login expects: `password123!` or `Password123!`

## Steps to Fix

### 1. Update Vercel Environment Variables

Go to your Vercel project settings and set these environment variables:

```
NEXTAUTH_URL=https://hipaa-journal-app-l4ea.vercel.app
NEXTAUTH_SECRET=[generate a secure random string - at least 32 characters]
DATABASE_URL=[your production database URL]
DIRECT_URL=[your production database direct URL if using Prisma Accelerate]
```

To generate a secure NEXTAUTH_SECRET, run:
```bash
openssl rand -base64 32
```

### 2. Update Password Requirements

Either:

**Option A: Relax password requirements** (not recommended for production)
- Update `/src/app/api/auth/register/route.ts` to reduce minimum length to 11

**Option B: Update seed passwords** (recommended)
- Change seed passwords to meet requirements, e.g., `Password123!@#`
- Update quick login buttons to use the new password

### 3. Update Seed Script for Production Compatibility

Update `/prisma/seed.ts` to use a password that meets requirements:
```typescript
const validPassword = 'SecurePass123!@#' // 16 chars, meets all requirements
```

### 4. Database Migration

Ensure the production database has the correct schema:
```bash
npx prisma migrate deploy
```

### 5. After Fixing Environment Variables

1. Redeploy the application on Vercel
2. The registration and login should work
3. Run the seed script against production database if needed

## Testing Checklist

- [ ] Environment variables updated in Vercel dashboard
- [ ] Application redeployed
- [ ] Registration page accepts new users
- [ ] Login works with correct credentials
- [ ] Quick login buttons work (if passwords updated)