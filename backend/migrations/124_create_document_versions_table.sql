-- Migration 124: Create Document Versions Table

CREATE TABLE document_versions (
    id VARCHAR(50) PRIMARY KEY,
    document_id VARCHAR(50) NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    size BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    note TEXT,
    UNIQUE(document_id, version_number)
);

-- Индекс для быстрого поиска версий документа
CREATE INDEX idx_document_versions_doc_id ON document_versions(document_id);

-- Добавляем колонку текущей версии в основную таблицу документов (опционально для кэширования)
ALTER TABLE documents ADD COLUMN current_version_id VARCHAR(50) REFERENCES document_versions(id) ON DELETE SET NULL;
