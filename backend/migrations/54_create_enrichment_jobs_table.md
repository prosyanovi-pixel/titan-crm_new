# Migration 54: Create enrichment_jobs table

```sql
CREATE TABLE IF NOT EXISTS enrichment_jobs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | running | done | error
  progress INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  skip_count INTEGER NOT NULL DEFAULT 0,
  current_name TEXT,
  results JSONB NOT NULL DEFAULT '[]',
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- Удаляем задачи старше 7 дней автоматически (можно поставить pg_cron)
CREATE INDEX IF NOT EXISTS idx_enrichment_jobs_started_at ON enrichment_jobs(started_at);
```
