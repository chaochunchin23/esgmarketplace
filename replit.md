# esgOne - ESG Marketplace Platform

## Overview

esgOne is a full-stack ESG (Environmental, Social, Governance) marketplace platform that connects users with ESG consultants and training courses. The platform enables users to browse consultant profiles, book consultations, enroll in courses, and manage payments through integrated payment providers.

The application serves as a B2B/B2C marketplace where:
- Users can discover and book ESG consultants
- Consultants can manage their profiles, bookings, and client communications
- Course providers can offer ESG training programs
- Payment processing is handled via PayPal and Stripe integrations

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite with path aliases (@/ for client/src, @db for database)

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Storage**: Memory store (memorystore)
- **API Structure**: RESTful endpoints under /api prefix

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: Neon Serverless PostgreSQL
- **Schema Location**: db/schema.ts
- **Migrations**: Drizzle Kit with migrations in /migrations folder

### Key Design Patterns
1. **Monorepo Structure**: Client, server, and database code co-located
2. **Protected Routes**: Client-side route protection with redirect to /auth
3. **Translation System**: OpenAI-powered translation with client-side caching for English/Traditional Chinese
4. **Shopping Cart**: Client-side cart with localStorage persistence

### Authentication Flow
- Local strategy using username/email + password
- Passwords hashed with scrypt
- Session-based authentication with HTTP-only cookies
- Role-based access: user, consultant, provider, admin

## External Dependencies

### Payment Processing
- **PayPal**: Server SDK integration for order creation and capture
  - Environment variables: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET
  - Sandbox mode for development, Production for live
- **Stripe**: React Stripe.js for frontend payment elements
  - Used for subscription management

### AI Services
- **OpenAI**: GPT-4o for translations and review sentiment analysis
  - DALL-E 3 for consultant photo generation
  - Environment variable: OPENAI_API_KEY

### Communication Services
- **SendGrid**: Email delivery (@sendgrid/mail)
- **Slack**: Web API integration (@slack/web-api)

### Database
- **Neon Serverless**: PostgreSQL database with WebSocket connections
  - Environment variable: DATABASE_URL
  - Connection via drizzle-orm/neon-serverless

### Build & Development
- Vite for frontend bundling and HMR
- esbuild for server bundling
- TypeScript for type safety across stack