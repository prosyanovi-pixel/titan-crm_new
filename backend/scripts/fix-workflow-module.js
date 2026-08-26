/**
 * Исправление записи модуля workflows в таблице modules
 * node scripts/fix-workflow-module.js
 */
require('dotenv').config();
const db = require('../db');

async function fix() {
  // Check current state
  const { rows: existing } = await db.query("SELECT id, name, folder FROM modules WHERE id = 'workflows'");
  console.log('Current workflows module row:', existing[0] || 'NOT FOUND');

  if (existing.length === 0) {
    // Insert if missing
    await db.query(`
      INSERT INTO modules (id, name, folder, icon, is_active)
      VALUES ('workflows', 'Воркфлоу', 'workflow', 'Network', true)
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('✅ Inserted workflows module row');
  } else if (!existing[0].folder) {
    // Update folder if null
    await db.query("UPDATE modules SET folder = 'workflow' WHERE id = 'workflows'");
    console.log('✅ Updated workflows module: folder = workflow');
  } else {
    console.log('✅ No fix needed, folder =', existing[0].folder);
  }

  await db.pool.end();
}

fix().catch(e => { console.error('❌', e.message); process.exit(1); });
