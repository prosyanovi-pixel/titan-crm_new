# Migration 52: Add uploaded_by to documents table

## Description
Adds `uploaded_by` column to the `documents` table to track which user uploaded a document.

## SQL

```sql
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(50);

ALTER TABLE documents
  ADD CONSTRAINT fk_documents_uploaded_by
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
```

## Notes
- Column is nullable — existing documents without an owner remain unaffected
- Enables filtering documents by user in the profile module
