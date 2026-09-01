# Contributing to TITAN CRM

## Overview
This document provides guidelines for contributing to the TITAN CRM project.

## Development Setup
1. Clone the repository
2. Install dependencies: `npm install` (root), `npm install --prefix frontend`, `npm install --prefix backend`
3. Run tests with `npm test` (backend integration, Jest), `npm --prefix frontend run test` (Vitest)
4. Start development server: `npm --prefix backend run dev` (API) and `npm --prefix frontend run dev` (UI)

## Code Style
- Follow TypeScript strict mode
- Use consistent naming conventions
- Write meaningful commit messages
- Include proper JSDoc comments

## Testing Requirements
- All new features must include unit tests
- Integration tests for API endpoints
- E2E tests for critical user flows
- Test coverage should be maintained at 80%+

## Pull Request Process
1. Fork the repository
2. Create feature branch
3. Make changes and write tests
4. Run all tests locally
5. Submit pull request with clear description
6. Address feedback from code review

## Documentation Standards
- Update documentation when adding new features
- Keep API documentation in sync with implementation
- Provide usage examples where applicable
- Maintain Russian language translations

## Issue Tracking
Use GitHub issues for bug reports and feature requests.
Include reproduction steps for bugs.
Label issues appropriately.