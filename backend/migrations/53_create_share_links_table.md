# Migration 53: Create share_links table

## Description
Creates the `share_links` table for sharing profile documents via public links.

## SQL

```sql
CREATE TABLE IF NOT EXISTS share_links (
    id          VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50) NOT NULL,
    created_by  VARCHAR(50) NOT NULL,
    expires_at  TIMESTAMP,
    created_at  TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_share_links_document  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    CONSTRAINT fk_share_links_user      FOREIGN KEY (created_by)  REFERENCES users(id)     ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_share_links_created_by  ON share_links(created_by);
CREATE INDEX IF NOT EXISTS idx_share_links_document_id ON share_links(document_id);
```

## Notes
- `expires_at` is nullable — null means the link never expires
- Deleting a document cascades deletion of its share links
- Deleting a user cascades deletion of their share links
