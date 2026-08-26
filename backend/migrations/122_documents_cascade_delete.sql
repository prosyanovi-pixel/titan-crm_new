ALTER TABLE documents DROP CONSTRAINT fk_documents_parent;
ALTER TABLE documents ADD CONSTRAINT fk_documents_parent FOREIGN KEY (parent_id) REFERENCES documents(id) ON DELETE CASCADE;
