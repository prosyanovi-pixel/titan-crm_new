# Database Schema Documentation

## Overview
PostgreSQL database for TITAN CRM. Access from the backend goes through `backend/db.js`, which automatically converts `snake_case` columns to `camelCase` in JS objects. Full table catalog: see [README.md](./README.md) (Russian). Machine-readable dump: `backend/db-structure.json` (regenerate with `npm --prefix backend run db:structure:json`).

## Conventions
- Columns: `snake_case` (e.g. `created_at`, `contractor_id`)
- JS objects: `camelCase` (conversion handled by `backend/db.js`)
- Migrations live in `backend/migrations/` and are applied with `npm --prefix backend run migrate`; applied migrations are tracked in `schema_migrations`
- Reference/status tables follow the pattern `<entity>_status`, `<entity>_type` etc.

## Core Tables (examples)

### users
- id (UUID PK), email, nickname, password_hash, role, telegram_token, is_blocked, last_active_at, created_at

### roles / permissions
- roles: id (UUID PK), name, permissions
- permissions: id (UUID PK), code, description; access matrix seeded via migrations (`29_seed_access_matrix`)

### contractors
- contractors: id (UUID PK), name, INN/legal form fields, tax regime fields, group_id, predecessor_id, support for individuals and foreign entities (migration 119)
- Related: contractor_contacts, contractor_bank_accounts, contractor_tags, contractor_tax_history

### projects / tasks
- projects: id (UUID PK), name, status, budget, dates, stage references (project_stages)
- tasks: id (UUID PK), project_id, status, priority, stage_id (migration 100), subtasks

### contracts
- contracts: id (UUID PK), number, template_id, project_id, expiration_date, start_date (migrations 301–319)
- Related: contract_versions, contract_approvals, contract_files, contract_audit_log

### documents
- documents: id (UUID PK), folder path, template flag (migration 104), deleted_at soft delete (migration 123)
- document_versions: file version history (migration 124)

### legal_cases
- legal_cases plus case_instances, case_documents, case_notes, case_events, case_status, case_type, case_outcome (migration 200)

### finance_*
- finance_invoices (with VAT columns, migration 112), finance_payments, finance_bank_statements, finance_statement_lines, tax references (finance_tax_rates, finance_tax_regimes with 2026 extensions, finance_ndfl_brackets)

## Relationships
- users → roles (many-to-one)
- tasks → projects (many-to-one)
- contract_files / contract_versions / contract_approvals → contracts (one-to-many)
- case_* tables → legal_cases (one-to-many)
- quote_items → quotes (one-to-many)

## Indexes
- Primary keys on all tables
- Foreign key constraints for referential integrity
- Indexes on frequently queried columns

## Constraints
- Email uniqueness constraint on users
- Unique constraints (e.g. contractor tags, migration 30)
- Status values managed via dedicated status tables rather than raw enums

