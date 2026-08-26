# Migration 07: Create Users Table

## Description
Create the users table to store user information.

## SQL Statement
```sql
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    initials VARCHAR(10),
    role VARCHAR(50),
    status VARCHAR(50),
    avatar VARCHAR(10),
    phone VARCHAR(50),
    department VARCHAR(100),
    email VARCHAR(255),
    specializations VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Columns
- `id` - Unique identifier for the user
- `name` - User full name
- `initials` - User initials
- `role` - User role (admin, manager, employee, etc.)
- `status` - User status (active, inactive, vacation, etc.)
- `avatar` - Avatar initials for the user
- `phone` - User phone number
- `department` - User department
- `email` - User email address

## Notes
Based on the existing data files, users would include:
- Project managers
- Lawyers
- Administrators
- Designers
- Technical staff
- Analysts

The user data combines information from:
- src/components/contractors/data.ts (managers)
- src/lib/mock-data.ts (mock users with roles)