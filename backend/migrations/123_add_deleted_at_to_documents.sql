ALTER TABLE documents
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;

CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON documents(deleted_at);
