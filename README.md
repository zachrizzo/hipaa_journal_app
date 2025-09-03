# HIPAA Journal - Secure Healthcare Journaling Platform

A HIPAA-aligned journaling platform designed for healthcare professionals and their clients. Features secure rich text editing, AI-powered summaries with PHI redaction, granular provider-client sharing, comprehensive analytics, and enterprise-grade audit logging. Note: compliance depends on deployment and organizational controls.

## 🏥 Features

### Security & Compliance
- **HIPAA-aligned design**: Full audit logging, encryption utilities, secure session management (see disclaimer)
- **Advanced Authentication**: NextAuth.js with role-based access, account lockout, 15-minute sessions
- **PHI Protection**: Automated PHI redaction with `redact-pii` before AI processing
- **Input Sanitization**: DOMPurify for XSS protection, TipTap content validation
- **Security Headers**: CSP, HSTS, X-Frame-Options, Permissions Policy
- **Audit Trail**: Complete audit logging for all PHI access, modifications, and sharing

### Core Functionality
- **Rich Text Editor**: Secure TipTap editor with JSON storage and HTML sanitization
- **AI Summarization**: PHI-safe OpenAI integration with LangChain for journal analysis
- **Provider-Client Sharing**: Granular sharing controls (`TITLE_ONLY`, `SUMMARY_ONLY`, `FULL_ACCESS`)
- **Version History**: Complete version tracking with change reasons and rollback capability
- **Analytics Dashboard**: Provider analytics with mood trends, risk indicators, time-bucket analysis
- **Risk Detection**: Automated clinical risk pattern detection in journal content
- **Mood Tracking**: 1-10 mood scale with trend analysis and clinical insights
- **Hierarchical Summaries**: Daily → Weekly → Monthly summary aggregation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 13+
- OpenAI API key (for AI features)

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd hipaa_journal_app
   npm install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database setup**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to access the application.

## 📋 Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build production application
- `npm run start` - Start production server

### Database
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio GUI


### Code Quality
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js App Router API routes, Prisma ORM, PostgreSQL
- **Authentication**: NextAuth.js with secure session management
- **Rich Text**: TipTap 3.3 editor with security sanitization
- **AI**: LangChain + OpenAI for PHI-safe summarization
- **Security**: DOMPurify, redact-pii, bcryptjs, validator



## 🖼️ Architecture Diagrams & Deep Dive

These annotated diagrams summarize how the system is structured and how critical workflows (PHI handling and AI summarization) operate. Images are checked into the repository to ensure they render anywhere Markdown is viewed.

### High-level system architecture (end-to-end)
<img src="./Screenshot 2025-09-03 at 5.23.51 PM.png" alt="High-level architecture: client, middleware/auth, API routes, security utilities, repositories/Prisma, database" width="100%" />

Key highlights:
- Client uses Next.js App Router pages and thin client services.
- Middleware enforces CSP/HSTS/RBAC and guards API and pages.
- API routes handle entries, providers, shares, and AI endpoints.
- Security utilities centralize sanitization, rate limits, audit logging, and optional encryption.
- Prisma provides typed DB access to Users, Sessions, JournalEntries, EntryVersions, EntryShares, and AuditLogs.

### Combined summaries pipeline (hierarchical)
<img src="./Screenshot 2025-09-03 at 5.28.39 PM.png" alt="Flow showing combined summaries: fetch entries, individual summaries if missing, group summaries, final combined summary, with security hooks" width="100%" />

Flow summary:
- Fetch entries with access checks; convert TipTap JSON to plain text.
- If an entry lacks `aiSummary`, generate one with PHI-safe guards.
- Group individual summaries into batches and generate group summaries.
- Generate a final combined summary across all inputs.
- Rate limits and audit logs applied; optional persistence of individual summaries.

### AI tree structure with examples (groupSize=2)
<img src="./Screenshot 2025-09-03 at 5.29.37 PM.png" alt="Tree view: Level 0 entries → Level 1 individual summaries → Level 2 grouped summaries → Level 3 final combined summary, with example moods/themes" width="100%" />

### AI tree structure with leftover group example (5 entries)
<img src="./Screenshot 2025-09-03 at 5.29.48 PM.png" alt="Tree view showing leftover group when entries are odd: G1=S1+S2, G2=S3+S4, G3=S5, then combine all" width="80%" />

### PHI lifecycle and security controls
<img src="./Screenshot 2025-09-03 at 5.34.21 PM.png" alt="PHI lifecycle map: TipTap input → API sanitization → DB storage → AI sanitization/redaction → validation → optional save, with middleware, rate limits, audit logging" width="100%" />

### Core data model ERD (Prisma)
<img src="./Screenshot 2025-09-03 at 5.34.44 PM.png" alt="Entity-relationship diagram of User, Session, JournalEntry, EntryVersion, EntryShare, AuditLog and their relations" width="100%" />

#### File pointers for the diagrams
- Middleware/auth: `src/middleware.ts`, `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`
- Security: `src/lib/security/*` (sanitize, audit, rate-limit, encryption)
- AI: `src/lib/ai/summarizer.ts`, `src/lib/services/content-processor.ts`
- Entries API: `src/app/api/entries/*`
- Shares API: `src/app/api/shares/*`, `src/app/api/providers/route.ts`
- Combined summaries API: `src/app/api/summaries/combined/route.ts`
- Prisma client: `src/lib/db.ts`; schema: `prisma/schema.prisma`

> Note: In production, replace `redact-pii` with Google Cloud DLP for higher-accuracy PHI detection and compliance-grade auditability.


### Security Features
- **AES-256 Encryption**: Sensitive data encrypted at rest
- **PHI Redaction**: Automated PHI removal before AI processing
- **Input Validation**: Zod schemas for all API endpoints
- **Content Sanitization**: DOMPurify + custom TipTap validation
- **Session Security**: 15-minute JWT tokens, secure cookies
- **Audit Logging**: Comprehensive logging for all PHI access
- **Role-based Access**: CLIENT and PROVIDER roles with granular permissions
- **Version Control**: Complete entry history with rollback capability



## 🔒 Security & HIPAA Compliance

### HIPAA Requirements Met
- ✅ Administrative safeguards (user access controls, audit logs)
- ✅ Physical safeguards (encryption at rest and in transit)
- ✅ Technical safeguards (access controls, audit trails, encryption)

### Security Measures
- All PHI access logged with context
- Data encrypted using AES-256
- Secure session management
- Input validation and sanitization
- Security headers and CSP
- Regular security audits

## 🚀 Deployment

### Environment Variables
Required environment variables (see `.env.example`):
```bash
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-key
ENCRYPTION_KEY=32-character-key
OPENAI_API_KEY=your-openai-key
```

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL/TLS certificates installed
- [ ] Security headers configured
- [ ] Monitoring set up

## 📊 Project Status

### Completed Features ✅
- [x] Project setup with Next.js 14 + TypeScript
- [x] Database schema with Prisma (HIPAA-compliant)
- [x] Authentication system with NextAuth.js
- [x] Secure rich text editor with TipTap
- [x] Audit logging system
- [x] Provider-client sharing features
- [x] AI summarization with LangChain
- [x] Security headers and middleware

### Architecture Highlights
- **Type Safety**: 100% TypeScript with strict mode
- **Security First**: Built with HIPAA compliance from ground up
- **Enterprise Ready**: Audit logging, monitoring
- **Scalable**: Prisma ORM, optimized queries, efficient architecture

---

**⚠️ Important**: This application handles Protected Health Information (PHI). Ensure proper security measures, compliance training, and legal review before production deployment.
