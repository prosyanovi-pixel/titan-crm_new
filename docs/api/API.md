# TITAN CRM API Documentation

## Overview
This document provides comprehensive documentation for all API endpoints in the TITAN CRM system.

## Authentication
All API requests require authentication via JWT tokens. Include the token in the Authorization header:
`Authorization: Bearer <token>`

## Base URL
`/api`

## Modules

### Administration
- `/api/administration/users`
- `/api/administration/roles` 
- `/api/administration/settings`

### Projects
- `/api/projects`
- `/api/projects/:id/tasks`

### Contracts
- `/api/contracts`
- `/api/contracts/:id/documents`

### Documents
- `/api/documents`
- `/api/documents/search`

### Legal Cases
- `/api/legal-cases`
- `/api/legal-cases/:id/documents`

### Reporting
- `/api/reports/dashboard`
- `/api/reports/generate`

### Notifications
- `/api/notifications`
- `/api/notifications/preferences`

## Error Handling
All API endpoints follow consistent error response format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
Rate Limiting
API requests are rate-limited to prevent abuse. Default limit is 100 requests per minute per IP.

Versioning
API versioning is handled through URL paths: /api/v1/...
Response Format
All successful responses follow this format:


Apply
{
  "data": {},
  "meta": {
    "timestamp": "2023-01-01T00:00:00Z",
    "version": "1.0"
  }
}
Common HTTP Status Codes
200 OK - Successful GET, PUT, PATCH requests
201 Created - Successful POST requests
204 No Content - Successful DELETE requests
400 Bad Request - Invalid request parameters
401 Unauthorized - Authentication required
403 Forbidden - Insufficient permissions
404 Not Found - Resource not found
422 Unprocessable Entity - Validation errors
500 Internal Server Error - Server-side error
Pagination
List endpoints support pagination:

GET /api/projects?page=1&limit=20
Filtering and Sorting
Support for filtering and sorting:

GET /api/projects?status=active&sort=-created_at
Search
Search functionality:

GET /api/documents/search?q=contract
File Uploads
File uploads use multipart/form-data:

POST /api/documents
Content-Type: multipart/form-data