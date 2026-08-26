const db = require('./backend/db');

async function checkDocumentsSchema() {
  try {
    console.log('--- Documents table ---');
    const schema = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'documents'");
    console.table(schema.rows);
    
    console.log('\n--- Row Count ---');
    const { rows } = await db.query("SELECT COUNT(*) FROM documents");
    console.log('Total documents:', rows[0].count);
  } catch (err) {
    console.error('Error checking schema:', err.message);
  } finally {
    process.exit();
  }
}

checkDocumentsSchema();
