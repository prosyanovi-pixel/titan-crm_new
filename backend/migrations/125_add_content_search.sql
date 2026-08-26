-- Migration 125: Add Content Search Support

-- Добавляем колонку для хранения извлеченного текста
ALTER TABLE documents ADD COLUMN content_text TEXT;

-- Создаем GIN индекс для полнотекстового поиска (поддержка русского и английского)
-- Мы используем триграммы (pg_trgm) для поиска по подстрокам, так как это гибче для имен файлов и кусков текста
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_documents_content_trgm ON documents USING gin (content_text gin_trgm_ops);
CREATE INDEX idx_documents_name_trgm ON documents USING gin (name gin_trgm_ops);
