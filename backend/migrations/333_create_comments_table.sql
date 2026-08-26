-- Создание универсальной таблицы комментариев для задач и контрактов
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- 'task', 'contract'
    entity_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);
