CREATE TABLE ai_insights (
    id VARCHAR(50) PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    insight_type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(entity_type, entity_id, insight_type)
);
