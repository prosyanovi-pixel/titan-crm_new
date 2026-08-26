const db = require('../db');

async function addJudgeExtraFields() {
  console.log('Adding extra fields to judges table...');

  // Add new columns to judges table
  await db.query(`
    ALTER TABLE judges 
    ADD COLUMN IF NOT EXISTS secretary_phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS assistant_phone VARCHAR(50),
    ADD COLUMN IF NOT EXISTS email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS office VARCHAR(20),
    ADD COLUMN IF NOT EXISTS composition VARCHAR(100)
  `);

  console.log('✅ Extra fields added to judges table');
}

module.exports = addJudgeExtraFields;
