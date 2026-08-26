-- Migration 13: Create System Logs Table
-- Description: Create a table to store logs from both backend and frontend

CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    level VARCHAR(20) NOT NULL,
    source VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    user_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
