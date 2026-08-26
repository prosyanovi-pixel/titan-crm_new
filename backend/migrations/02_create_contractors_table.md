
# Migration 02: Create Contractors Table

## Description
Create the contractors table to store contractor information.

## SQL Statement
```sql
CREATE TABLE contractors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    status VARCHAR(50),
    phone VARCHAR(50),
    manager VARCHAR(255),
    inn VARCHAR(20),
    kpp VARCHAR(20),
    ogrn VARCHAR(20),
    legal_address TEXT,
    legal_form VARCHAR(50),
    type VARCHAR(50),
    currency VARCHAR(10),
    registration_date VARCHAR(50),
    director VARCHAR(255),
    director_position VARCHAR(255),
    notes TEXT
);
```

## Columns
- `id` - Unique identifier
- `name` - Short name
- `full_name` - Full legal name
- `status` - Status (active, pending, etc.)
- `phone` - Contact phone
- `manager` - Assigned manager
- `inn` - Tax ID
- `kpp` - Reason code
- `ogrn` - State registration number
- `legal_address` - Legal address
- `legal_form` - Form (ooo, ip, etc.) - References `legal_form` table
- `type` - Relationship type (client, partner, etc.) - References `contractor_type` table
- `currency` - Currency for settlements
- `registration_date` - Date of registration
- `director` - Name of director/signer
- `director_position` - Position of the signer
- `notes` - Internal notes

## Additional Tables

### Contractor Tags Table
```sql
CREATE TABLE contractor_tags (
    id SERIAL PRIMARY KEY,
    contractor_id INTEGER REFERENCES contractors(id) ON DELETE CASCADE,
    tag VARCHAR(100)
);
```

### Contractor Bank Accounts Table
```sql
CREATE TABLE contractor_bank_accounts (
    id VARCHAR(50) PRIMARY KEY,
    contractor_id INTEGER REFERENCES contractors(id) ON DELETE CASCADE,
    bank_name VARCHAR(255),
    bik VARCHAR(20),
    account_number VARCHAR(50),
    correspondent_account VARCHAR(50),
    currency VARCHAR(10),
    is_primary BOOLEAN
);
```

### Contractor Contacts Table
```sql
CREATE TABLE contractor_contacts (
    id VARCHAR(50) PRIMARY KEY,
    contractor_id INTEGER REFERENCES contractors(id) ON DELETE CASCADE,
    name VARCHAR(255),
    position VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    is_primary BOOLEAN
);
```
