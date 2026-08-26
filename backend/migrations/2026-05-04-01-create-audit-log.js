/**
 * Migration: Create administration_audit_log table
 * 
 * Version: 2026-05-04-01
 * 
 * Purpose: Track all changes to users, employees, roles, and permissions
 * Enables: Audit trails, change history, compliance reporting
 * 
 * @async
 * @param {Object} pool - PostgreSQL connection pool
 * @param {Object} logger - Logger instance
 */

async function up(pool, logger) {
  const client = await pool.connect();
  
  try {
    logger.info('Migration 2026-05-04-01: Creating administration_audit_log table...');
    
    await client.query('BEGIN');

    // Create audit log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS administration_audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(255) NOT NULL,
        action VARCHAR(20) NOT NULL,
        changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        old_values JSONB,
        new_values JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_entity 
      ON administration_audit_log(entity_type, entity_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_changed_by 
      ON administration_audit_log(changed_by);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_log_created_at 
      ON administration_audit_log(created_at);
    `);

    await client.query('COMMIT');
    
    logger.info('✅ Migration 2026-05-04-01: Completed successfully');
    return { success: true, message: 'Audit log table created' };
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Migration 2026-05-04-01 failed:', error.message);
    throw error;
    
  } finally {
    client.release();
  }
}

async function down(pool, logger) {
  const client = await pool.connect();
  
  try {
    logger.info('Migration 2026-05-04-01: Rolling back...');
    
    await client.query('BEGIN');

    // Drop indexes
    await client.query('DROP INDEX IF EXISTS idx_audit_log_created_at');
    await client.query('DROP INDEX IF EXISTS idx_audit_log_changed_by');
    await client.query('DROP INDEX IF EXISTS idx_audit_log_entity');

    // Drop table
    await client.query('DROP TABLE IF EXISTS administration_audit_log');

    await client.query('COMMIT');
    
    logger.info('✅ Migration 2026-05-04-01: Rollback completed');
    return { success: true, message: 'Audit log table dropped' };
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Migration 2026-05-04-01 rollback failed:', error.message);
    throw error;
    
  } finally {
    client.release();
  }
}

module.exports = { up, down };
