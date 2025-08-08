# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

- `npm run dev` - Start development server with hot reload using ts-node-dev
- `npm run build` - Compile TypeScript to JavaScript in dist/
- `npm start` - Run production server from dist/app.js
- `npm run type-check` - Type check without building
- `npm run lint` - Run ESLint on src/\*_/_.ts
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run health` - Health check the running server

### Database Operations

- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:push` - Push schema changes to database
- `npm run prisma:studio` - Open Prisma Studio
- `npm run prisma:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data
- `npm run db:reset` - Reset database and reseed

### Deployment

- `npm run vercel-build` - Build for Vercel deployment (generates Prisma client + builds)

## Architecture Overview

### Core Application Structure

This is an Express.js backend for an ATS-compliant CV and cover letter generation system. The application follows a layered architecture:

- **Controllers** (src/controllers/): Handle HTTP requests and responses
- **Services** (src/services/): Business logic and external integrations
- **Routes** (src/routes/): API endpoint definitions
- **Middleware** (src/middleware/): Cross-cutting concerns (auth, validation, security)
- **Types** (src/types/): TypeScript type definitions

### Key Services Architecture

#### CV Generation System

The CV generation is template-based with multiple service implementations:

- `CVGeneratorService`: Main orchestrator that manages all template types
- Template services: `CVTemplateBasicHRService`, `CVTemplateOfficeManagerService`, `CVTemplateSimpleClassicService`, etc.
- Each template service generates PDFs using PDFKit with specific layouts
- Templates are located in `/templates/` directory as reference PDFs

#### AI Integration

- `claude.service.ts`: Integrates with Anthropic's Claude API for intelligent CV generation
- Used for content optimization and ATS compliance enhancement

#### Database Layer

- Uses Prisma ORM with PostgreSQL
- Main models: User, CoverLetterBasic, CoverLetterDetailed, CVGeneration, UserProfile, etc.
- `DatabaseService`: Singleton pattern for database connection management

#### Authentication & Security

- JWT-based authentication (`jwt.service.ts`)
- Rate limiting with different tiers (general and API-specific)
- Helmet for security headers, CORS configuration
- User limits enforced via `UserLimitService`

### Key Integrations

- **File Processing**: PDF parsing, DOCX processing, image handling
- **Email Service**: Using Resend for email notifications
- **Caching**: LRU cache implementation for performance
- **Queue System**: Background job processing
- **Logging**: Winston for structured logging

### Environment Configuration

The application requires these environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `ANTHROPIC_API_KEY`: Claude AI API key
- `JWT_SECRET`: JSON Web Token secret
- `RESEND_API_KEY`: Email service API key

### File Upload Handling

- CV uploads processed in `/uploads/cv/` directory
- Temporary files in `/uploads/temp/`
- Multiple parsers: PDF, DOCX, and image analysis

### Development Notes

- TypeScript with strict type checking enabled
- ESLint configured for code quality
- Font assets included for PDF generation in `src/assets/fonts/`
- Postman collection available for API testing
