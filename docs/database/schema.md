# Database Schema Documentation

## Overview
This document describes the database schema for TITAN CRM, including tables, relationships, and constraints.

## Core Tables

### Users Table
- id (UUID)
- username (VARCHAR)
- email (VARCHAR)
- password_hash (VARCHAR)
- first_name (VARCHAR)
- last_name (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- is_active (BOOLEAN)

### Roles Table
- id (UUID)
- name (VARCHAR)
- description (TEXT)
- created_at (TIMESTAMP)

### User_Roles Table (Junction)
- user_id (UUID)
- role_id (UUID)

### Projects Table
- id (UUID)
- name (VARCHAR)
- description (TEXT)
- status (VARCHAR)
- start_date (DATE)
- end_date (DATE)
- created_by (UUID)
- created_at (TIMESTAMP)

### Contracts Table
- id (UUID)
- title (VARCHAR)
- description (TEXT)
- status (VARCHAR)
- start_date (DATE)
- end_date (DATE)
- client_id (UUID)
- created_at (TIMESTAMP)

### Documents Table
- id (UUID)
- filename (VARCHAR)
- path (VARCHAR)
- size (BIGINT)
- mime_type (VARCHAR)
- uploaded_by (UUID)
- created_at (TIMESTAMP)

## Relationships
- Users ↔ Roles (Many-to-Many via User_Roles)
- Projects ↔ Users (Many-to-Many via Project_Members)
- Contracts ↔ Documents (One-to-Many)
- Projects ↔ Tasks (One-to-Many)

## Indexes
- Primary keys on all tables
- Foreign key constraints for referential integrity
- Indexes on frequently queried columns

## Constraints
- Email uniqueness constraint
- Status enum validation
- Date range validation
