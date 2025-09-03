# HIPAA Journal - Secure Healthcare Journaling Platform

A production-ready, HIPAA-compliant journaling platform built for healthcare professionals and their clients. Features secure rich text editing, AI-powered summaries with PHI redaction, granular provider-client sharing, comprehensive analytics, and enterprise-grade audit logging.

## 🏥 Features

### Security & Compliance
- **HIPAA Compliant**: Full audit logging, AES-256 encryption, secure session management
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

### Testing
- `npm run test` - Run unit tests
- `npm run test:coverage` - Generate coverage report
- `npm run test:e2e` - Run Playwright E2E tests

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
- **Testing**: Jest, Testing Library, Playwright

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐
│   Client Users  │    │ Provider Users  │
│   (Patients)    │    │ (Healthcare)    │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────┬───────────┘
                     │
          ┌─────────────────────┐
          │   Security Layer    │
          │ • Role-based Auth   │
          │ • Security Headers  │
          │ • Rate Limiting     │
          └─────────┬───────────┘
                    │
          ┌─────────────────────┐
          │     API Layer       │
          │ • /api/entries      │
          │ • /api/shares       │
          │ • /api/summaries    │
          │ • /api/analytics    │
          └─────────┬───────────┘
                    │
          ┌─────────────────────┐
          │  Business Logic     │
          │ • PHI Redaction     │
          │ • Content Sanitize  │
          │ • Audit Logging     │
          │ • AI Processing     │
          └─────────┬───────────┘
                    │
          ┌─────────────────────┐
          │   Database Layer    │
          │ • PostgreSQL        │
          │ • Encrypted Storage │
          │ • Version History   │
          └─────────────────────┘
```

### Security Features
- **AES-256 Encryption**: Sensitive data encrypted at rest
- **PHI Redaction**: Automated PHI removal before AI processing
- **Input Validation**: Zod schemas for all API endpoints
- **Content Sanitization**: DOMPurify + custom TipTap validation
- **Session Security**: 15-minute JWT tokens, secure cookies
- **Audit Logging**: Comprehensive logging for all PHI access
- **Role-based Access**: CLIENT and PROVIDER roles with granular permissions
- **Version Control**: Complete entry history with rollback capability

## 🧪 Testing

This project includes comprehensive testing:
- **Unit Tests**: Components, utilities, security functions
- **Integration Tests**: API endpoints, database operations  
- **E2E Tests**: Critical user journeys with Playwright

Run tests:
```bash
npm run test              # Unit tests
npm run test:coverage     # Coverage report
npm run test:e2e          # End-to-end tests
```

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
- [x] Testing infrastructure (Jest + Playwright)
- [x] Security headers and middleware

### Architecture Highlights
- **Type Safety**: 100% TypeScript with strict mode
- **Security First**: Built with HIPAA compliance from ground up
- **Enterprise Ready**: Comprehensive testing, audit logging, monitoring
- **Scalable**: Prisma ORM, optimized queries, efficient architecture

---

**⚠️ Important**: This application handles Protected Health Information (PHI). Ensure proper security measures, compliance training, and legal review before production deployment.
