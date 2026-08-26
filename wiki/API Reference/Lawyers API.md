# Lawyers API

<cite>
**Referenced Files in This Document**
- [backend/modules/lawyers/routes.js](file://backend/modules/lawyers/routes.js)
- [backend/modules/lawyers/controllers.js](file://backend/modules/lawyers/controllers.js)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Base URL](#base-url)
3. [Authentication](#authentication)
4. [Endpoints](#endpoints)
5. [Data Models](#data-models)

## Introduction
The Lawyers API provides endpoints for managing legal professionals within Titan CRM. It allows for retrieving lists of lawyers, viewing individual profiles, and managing lawyer-specific metadata such as specializations and ratings.

## Base URL
All endpoints are relative to: `/api/lawyers`

## Authentication
Requires a valid JWT token in the `Authorization` header. Specific permissions (e.g., `lawyers.read`, `lawyers.write`) may be enforced.

## Endpoints

### List Lawyers
Retrieve a comprehensive list of all lawyers aggregated from users and employees.

- **Method**: `GET`
- **URL**: `/`
- **Response**: `200 OK`
- **Body**: `Array<Lawyer>`

### Get Lawyer by ID
Retrieve detailed information for a specific lawyer.

- **Method**: `GET`
- **URL**: `/:id`
- **Response**: `200 OK`
- **Body**: `Lawyer`
- **Errors**: `404 Not Found`

### Create Lawyer
Create a new lawyer entry in the system.

- **Method**: `POST`
- **URL**: `/`
- **Request Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "phone": "string",
    "status": "active | inactive",
    "specializations": "string[]",
    "rating": "number",
    "hourlyRate": "number"
  }
  ```
- **Response**: `201 Created`
- **Body**: `Lawyer`

### Update Lawyer
Update an existing lawyer's profile.

- **Method**: `PUT`
- **URL**: `/:id`
- **Request Body**: Partial `Lawyer` object.
- **Response**: `200 OK`
- **Body**: `Lawyer`
- **Errors**: `404 Not Found`

### Delete Lawyer
Remove a lawyer from the system.

- **Method**: `DELETE`
- **URL**: `/:id`
- **Response**: `200 OK`
- **Body**: `{ "success": true, "message": "Lawyer deleted" }`

## Data Models

### Lawyer
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "status": "string",
  "role": "Юрист",
  "specializations": "string[]",
  "rating": "number",
  "hourlyRate": "number",
  "activeCasesCount": "number",
  "wonCasesCount": "number"
}
```
