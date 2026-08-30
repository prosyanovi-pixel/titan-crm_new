# Development Guide

## Project Structure

### Frontend (`frontend/`)
- `src/components/` - Reusable UI components
- `src/modules/` - Module-specific components and logic
- `src/services/` - API service layer
- `src/hooks/` - Custom React hooks
- `src/utils/` - Utility functions

### Backend (`backend/`)
- `src/controllers/` - Request handlers
- `src/models/` - Database models
- `src/middleware/` - Express middleware
- `src/routes/` - API route definitions
- `src/services/` - Business logic services

## Build Process
1. Run `npm run build` to compile TypeScript
2. Run `npm run lint` for code quality checks
3. Run `npm test` for unit and integration tests

## Deployment
1. Build production artifacts
2. Deploy to staging environment
3. Run end-to-end tests
4. Deploy to production

## Environment Variables
- `.env.local` - Local development variables
- `.env.production` - Production variables
- `.env.test` - Test environment variables

## Security Considerations
- All API routes require authentication
- Input validation on all endpoints
- Secure password hashing
- CSRF protection for web forms