# HIPAA Journal - Secure Healthcare Journaling Platform

A production-ready, HIPAA-compliant journaling platform built for healthcare professionals and their clients. Features secure rich text editing, AI-powered summaries, provider-client sharing, and comprehensive audit logging.

## 🏥 Features

### Security & Compliance
- **HIPAA Compliant**: Full audit logging, encryption at rest, secure session management
- **Advanced Authentication**: NextAuth.js with MFA support, account lockout, session rotation
- **Input Sanitization**: DOMPurify for XSS protection, content validation
- **Security Headers**: CSP, HSTS, X-Frame-Options, and more
- **Audit Trail**: Complete audit logging for all PHI access and modifications

### Core Functionality
- **Rich Text Editor**: Secure TipTap editor with JSON storage and HTML sanitization
- **AI Summarization**: LangChain + OpenAI for privacy-preserving journal summaries
- **Provider-Client Sharing**: Granular sharing controls with expiration and revocation
- **Version History**: Complete version tracking with change reasons
- **Mood Tracking**: 1-10 mood scale with trend analysis
- **Tagging System**: Flexible tagging for categorization and search

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
- **Frontend**: Next.js 14, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Authentication**: NextAuth.js with secure session management
- **Rich Text**: TipTap editor with security sanitization
- **AI**: LangChain + OpenAI for summarization
- **Testing**: Jest, Testing Library, Playwright

### Security Features
- **Data Encryption**: Sensitive fields encrypted at rest
- **Input Validation**: Zod schemas for all API endpoints
- **Content Sanitization**: DOMPurify for rich text content
- **Session Security**: 15-minute access tokens, secure cookies
- **Audit Logging**: All PHI access and modifications logged
- **Role-based Access**: Client, Provider, and Admin roles

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
