# Type System Documentation

This document explains how to use the generated database types consistently throughout the application.

## 🚀 Overview

All database types are automatically generated from our Prisma schema. This ensures type safety and prevents drift between the database schema and TypeScript types.

## 📁 File Structure

```
src/types/
├── index.ts          # Centralized type exports
├── database.ts       # Generated Prisma types + custom types
├── api.ts           # API request/response types
└── README.md        # This documentation
```

## 🔧 How to Use Types

### ✅ Correct Usage

```typescript
// Import from the centralized types
import type { User, JournalEntry, CreateEntryInput, UserRole } from '@/types'

// Or import specific types
import type { User, EntryStatus } from '@/types/database'

// Use in components
interface Props {
  user: User
  entries: JournalEntry[]
  onCreate: (data: CreateEntryInput) => void
}
```

### ❌ Avoid These Patterns

```typescript
// Don't create manual types that duplicate generated ones
interface User {
  id: string
  email: string
  role: 'CLIENT' | 'PROVIDER' | 'ADMIN'  // ❌ Use UserRole enum
}

// Don't use inline imports
import { User } from '@prisma/client'  // ❌ Use from @/types

// Don't create manual input types
interface CreateUserInput {
  email: string
  role: UserRole  // ❌ Use from @/types/database
}
```

## 🎯 Available Types

### Core Database Models
- `User` - User account information
- `Session` - User sessions
- `JournalEntry` - Journal entries
- `EntryVersion` - Version history
- `EntryShare` - Entry sharing records
- `AuditLog` - Audit trail

### Enums
- `UserRole` - CLIENT, PROVIDER, ADMIN
- `ShareScope` - NONE, TITLE_ONLY, SUMMARY_ONLY, FULL_ACCESS
- `EntryStatus` - DRAFT, PUBLISHED, ARCHIVED
- `AuditAction` - CREATE, READ, UPDATE, DELETE, SHARE, UNSHARE

### Composite Types
- `UserWithSessions` - User with session data
- `JournalEntryWithUser` - Entry with user information
- `SafeUser` - User without sensitive fields

### Input Types
- `CreateUserInput` - For user creation
- `CreateEntryInput` - For entry creation
- `UpdateEntryInput` - For entry updates
- `CreateShareInput` - For sharing entries

## 🛠️ Development Workflow

### 1. Schema Changes
When you update `prisma/schema.prisma`:

```bash
npm run db:generate  # Generates new types
npm run type-check   # Verify everything compiles
```

### 2. Using New Types
After generation, new types are automatically available:

```typescript
import type { NewType } from '@/types'
```

### 3. Type Checking
Run these commands to ensure type consistency:

```bash
npm run type-check    # TypeScript compilation
npm run lint         # ESLint rules (catches manual types)
```

## 🚨 ESLint Rules

The following ESLint rules enforce type consistency:

- **Manual type prevention**: Warns against creating interfaces that duplicate generated types
- **Property warnings**: Alerts when using common database field names manually
- **Import consistency**: Encourages using centralized type imports

## 📋 Best Practices

1. **Always import from `@/types`** - Use the centralized exports
2. **Don't create manual database types** - Let Prisma generate them
3. **Use enums instead of string literals** - `UserRole.ADMIN` vs `'ADMIN'`
4. **Run type checks frequently** - Catch issues early
5. **Update types after schema changes** - Always run `npm run db:generate`

## 🔍 Troubleshooting

### "Type not found" errors
```bash
# Regenerate types
npm run db:generate

# Check if types exist
ls node_modules/.prisma/client/index.d.ts
```

### ESLint warnings
- Review the warning message
- Replace manual types with generated ones
- Import from `@/types` instead of `@prisma/client`

### Type mismatches
- Ensure schema matches database
- Run migrations if needed: `npm run db:migrate`
- Regenerate types: `npm run db:generate`
