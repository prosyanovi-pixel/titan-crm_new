const express = require('express');
const router = express.Router();
const db = require('../../db');
const { asyncHandler } = require('../../utils/errorHandler');
const logger = require('../../utils/logger');

// Define tables that support soft delete
const TRASHABLE_TABLES = [
  { table: 'projects', nameColumn: 'name' },
  { table: 'tasks', nameColumn: 'title' },
  { table: 'contractors', nameColumn: 'name' },
  { table: 'contracts', nameColumn: 'name' },
  { table: 'products', nameColumn: 'name' },
  { table: 'marketing_campaigns', nameColumn: 'name' },
  { table: 'documents', nameColumn: 'name' }
];

// GET /api/trash - list all soft-deleted items
router.get('/', asyncHandler(async (req, res) => {
  let allTrash = [];
  
  for (const { table, nameColumn } of TRASHABLE_TABLES) {
    try {
      const query = `
        SELECT id, ${nameColumn} as name, '${table}' as module, deleted_at
        FROM ${table}
        WHERE deleted_at IS NOT NULL
        ORDER BY deleted_at DESC
      `;
      const { rows } = await db.query(query);
      allTrash = allTrash.concat(rows);
    } catch (err) {
      logger.error(`Error fetching trash for table ${table}`, err);
    }
  }
  
  // Sort overall by deleted_at desc
  allTrash.sort((a, b) => new Date(b.deletedAt || b.deleted_at) - new Date(a.deletedAt || a.deleted_at));
  
  res.json(allTrash);
}));

// POST /api/trash/:module/:id/restore - restore an item
router.post('/:module/:id/restore', asyncHandler(async (req, res) => {
  const { module, id } = req.params;
  
  const tableConfig = TRASHABLE_TABLES.find(t => t.table === module);
  if (!tableConfig) {
    return res.status(400).json({ error: 'Invalid module' });
  }
  
  const query = `UPDATE ${module} SET deleted_at = NULL WHERE id = $1 RETURNING id`;
  const { rows } = await db.query(query, [id]);
  
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  res.json({ success: true, message: 'Item restored' });
}));

// DELETE /api/trash/:module/:id - hard delete
router.delete('/:module/:id', asyncHandler(async (req, res) => {
  const { module, id } = req.params;
  
  const tableConfig = TRASHABLE_TABLES.find(t => t.table === module);
  if (!tableConfig) {
    return res.status(400).json({ error: 'Invalid module' });
  }
  
  const query = `DELETE FROM ${module} WHERE id = $1 AND deleted_at IS NOT NULL RETURNING id`;
  const { rows } = await db.query(query, [id]);
  
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Item not found in trash' });
  }
  
  res.json({ success: true, message: 'Item permanently deleted' });
}));

// POST /api/trash/empty - empty all trash
router.post('/empty', asyncHandler(async (req, res) => {
  for (const { table } of TRASHABLE_TABLES) {
    try {
      await db.query(`DELETE FROM ${table} WHERE deleted_at IS NOT NULL`);
    } catch (err) {
      logger.error(`Error emptying trash for table ${table}`, err);
    }
  }
  
  res.json({ success: true, message: 'Trash emptied' });
}));

// Auto-cleanup job triggered internally or by cron
router.post('/cleanup', asyncHandler(async (req, res) => {
  // Read retention settings
  const { rows } = await db.query("SELECT value FROM system_settings WHERE setting_key = 'trash_auto_clean'");
  let settings = { enabled: true, retention_days: 30 };
  
  if (rows.length > 0) {
    settings = typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value;
  }
  
  if (!settings.enabled) {
    return res.json({ success: true, message: 'Auto-cleanup is disabled' });
  }
  
  const retentionDays = settings.retention_days || 30;
  
  let deletedCount = 0;
  for (const { table } of TRASHABLE_TABLES) {
    try {
      const result = await db.query(`
        DELETE FROM ${table} 
        WHERE deleted_at IS NOT NULL 
        AND deleted_at < NOW() - INTERVAL '${retentionDays} days'
      `);
      deletedCount += result.rowCount || 0;
    } catch (err) {
      logger.error(`Error auto-cleaning trash for table ${table}`, err);
    }
  }
  
  res.json({ success: true, deletedCount, message: `Auto-cleaned ${deletedCount} items` });
}));

module.exports = router;
