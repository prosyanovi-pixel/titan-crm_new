# Migration 03: Create Documents Table

## Description
Create the documents table to store document and folder information.

## SQL Statement
```sql
CREATE TABLE documents (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    size VARCHAR(50),
    date VARCHAR(50),
    parent_Id VARCHAR(50),
    starred BOOLEAN DEFAULT FALSE
);

-- Добавляем внешний ключ для parent_id (опционально, но рекомендуется)
ALTER TABLE documents ADD CONSTRAINT fk_documents_parent FOREIGN KEY (parent_id) REFERENCES documents(id) ON DELETE SET NULL;

-- Индекс для ускорения запросов по parent_id (опционально, но рекомендуется)
CREATE INDEX idx_documents_parent_id ON documents(parent_id);
```

## Columns
- `id` - Unique identifier for the document/folder
- `name` - Name of the document or folder
- `type` - Type of item (folder, pdf, doc, xls, image, etc.)
- `size` - File size (for files only)
- `date` - Creation or modification date
- `parentId` - Parent folder ID (null for root items)
- `starred` - Whether the item is starred/favorited

## Notes
- This table stores both files and folders
- Folders have type 'folder' and typically don't have a size
- Files have specific types (pdf, doc, xls, image) and sizes
- The parentId column creates the folder hierarchy