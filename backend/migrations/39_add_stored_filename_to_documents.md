# Migration 39: Add stored_filename to documents table

## Description
Add stored_filename column to documents table to store the actual filename used on disk (multer generates unique filenames).

## SQL Statement
```sql
ALTER TABLE documents ADD COLUMN IF NOT EXISTS stored_filename VARCHAR(255);
```

## Notes
- stored_filename contains the actual filename on disk (e.g., "a1b2c3d4.pdf")
- name column contains the original filename shown to user (e.g., "document.pdf")
- This allows proper file storage and retrieval

## Rollback (manual only)
```sql
-- Manual rollback if needed:
-- ALTER TABLE documents DROP COLUMN stored_filename;
```
