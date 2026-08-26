-- Migration 64: Create enrichment statistics table
-- Tracks API usage for enrichment services (DaData, api-fns.ru)

CREATE TABLE IF NOT EXISTS enrichment_stats (
    id SERIAL PRIMARY KEY,
    service VARCHAR(50) NOT NULL,  -- 'dadata', 'apifns', etc.
    inn VARCHAR(20),               -- ИНН контрагента (для детализации)
    contractor_id INTEGER,         -- ID контрагента (опционально)
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT TRUE,  -- Успешный ли был запрос
    error_message TEXT             -- Текст ошибки (если была)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_enrichment_stats_service_date 
    ON enrichment_stats(service, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_enrichment_stats_service 
    ON enrichment_stats(service);

-- Представление для статистики по дням
CREATE OR REPLACE VIEW enrichment_stats_daily AS
SELECT 
    service,
    DATE(requested_at) AS stat_date,
    COUNT(*) AS total_requests,
    COUNT(*) FILTER (WHERE success = TRUE) AS successful_requests,
    COUNT(*) FILTER (WHERE success = FALSE) AS failed_requests
FROM enrichment_stats
GROUP BY service, DATE(requested_at)
ORDER BY stat_date DESC;

-- Комментарий
COMMENT ON TABLE enrichment_stats IS 'Статистика запросов к сервисам обогащения (DaData, api-fns.ru)';
