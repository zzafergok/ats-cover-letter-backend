# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development

- `npm run dev` - Start development server with hot reload using ts-node-dev
- `npm run build` - Compile TypeScript to JavaScript in dist/
- `npm start` - Run production server from dist/app.js
- `npm run type-check` - Type check without building
- `npm run lint` - Run ESLint on src/**/*.ts
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

- `CVGeneratorService`: Main orchestrator that manages template types: `basic_hr`, `office_manager`, `simple_classic`, `stylish_accounting`, `minimalist_turkish`
- Template services: Each implements specific PDF layouts using PDFKit
- Templates are located in `/templates/` directory as reference PDFs
- User limits enforced per generation via `UserLimitService`

#### AI Integration & Analysis

- `claude.wrapper.service.ts`: Wrapper for Anthropic's Claude API
- `jobPostingAnalysis.service.ts`: Analyzes job postings and provides ATS optimization recommendations
- `atsOptimization.service.ts`: Provides CV optimization based on job requirements
- `cvJobMatch.service.ts`: Matches CV content against job descriptions

#### Database Layer

- Uses Prisma ORM with PostgreSQL
- Main models: User, CoverLetterBasic, CoverLetterDetailed, CVGeneration, UserProfile
- Profile models: Education, Experience, Course, Certificate, Hobby, Skill
- `DatabaseService`: Singleton pattern for database connection management

#### Salary & Tax System

- `salaryCalculation.service.ts`: Gross-to-net and net-to-gross salary calculations
- `taxCalculation.service.ts`: Turkish tax calculations with yearly limits
- `taxConfiguration.service.ts`: Tax configuration and limits management

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

Required environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `ANTHROPIC_API_KEY`: Claude AI API key
- `JWT_SECRET`: JSON Web Token secret
- `RESEND_API_KEY`: Email service API key
- `NODE_ENV`: Environment (development/production)

Optional variables:
- `PORT`: Server port (defaults to 5000)

### File Upload Handling

- CV uploads processed in `/uploads/cv/` directory
- Temporary files in `/uploads/temp/`
- Multiple parsers: PDF, DOCX, and image analysis

### Development Notes

- TypeScript with strict type checking enabled
- ESLint configured for code quality
- Font assets included for PDF generation in `src/assets/fonts/`
- No tests configured (`npm test` returns error)
- Application includes Turkish tax calculations and salary processing
- Multi-language support for CV templates (Turkish/English)
- Production deployment configured for Vercel with Prisma generation
