/**
 * Migration: Create report_configs table
 *
 * Version: 2026-05-29-01
 *
 * Purpose: Хранение пользовательских конфигураций конструктора отчётов.
 * Enables: Сохранение, переиспользование и sharing отчётов между пользователями.
 *
 * @async
 * @param {Object} pool - PostgreSQL connection pool
 * @param {Object} logger - Logger instance
 */

async function up(pool, logger) {
  const client = await pool.connect();

  try {
    logger.info('Migration 2026-05-29-01: Creating report_configs table...');

    await client.query('BEGIN');

    // Создать таблицу конфигураций отчётов
    await client.query(`
      CREATE TABLE IF NOT EXISTS report_configs (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(255) NOT NULL,
        description TEXT,
        report_type VARCHAR(100) NOT NULL,
        filters     JSONB        NOT NULL DEFAULT '{}',
        columns     JSONB        NOT NULL DEFAULT '[]',
        chart_type  VARCHAR(50),
        is_shared   BOOLEAN      NOT NULL DEFAULT FALSE,
        created_by  VARCHAR(50)  REFERENCES users(id) ON DELETE SET NULL,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);

    // Индекс по автору для быстрой выборки "мои отчёты"
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_report_configs_created_by
        ON report_configs(created_by);
    `);

    // Индекс по типу отчёта
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_report_configs_type
        ON report_configs(report_type);
    `);

    // Частичный индекс для shared отчётов
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_report_configs_shared
        ON report_configs(is_shared)
        WHERE is_shared = TRUE;
    `);

    // Триггерная функция для автообновления updated_at (если ещё нет)
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Триггер на таблицу
    await client.query(`
      DROP TRIGGER IF EXISTS trg_report_configs_updated_at ON report_configs;
      CREATE TRIGGER trg_report_configs_updated_at
        BEFORE UPDATE ON report_configs
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query('COMMIT');

    logger.info('✅ Migration 2026-05-29-01: Completed successfully');
    return { success: true, message: 'report_configs table created' };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Migration 2026-05-29-01 failed:', error.message);
    throw error;

  } finally {
    client.release();
  }
}

async function down(pool, logger) {
  const client = await pool.connect();

  try {
    logger.info('Migration 2026-05-29-01: Rolling back...');

    await client.query('BEGIN');

    await client.query('DROP TRIGGER IF EXISTS trg_report_configs_updated_at ON report_configs');
    await client.query('DROP INDEX IF EXISTS idx_report_configs_shared');
    await client.query('DROP INDEX IF EXISTS idx_report_configs_type');
    await client.query('DROP INDEX IF EXISTS idx_report_configs_created_by');
    await client.query('DROP TABLE IF EXISTS report_configs');

    await client.query('COMMIT');

    logger.info('✅ Migration 2026-05-29-01: Rollback completed');
    return { success: true, message: 'report_configs table dropped' };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Migration 2026-05-29-01 rollback failed:', error.message);
    throw error;

  } finally {
    client.release();
  }
}

module.exports = { up, down };
