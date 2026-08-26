const db = require('./db');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function resetDatabase() {
  console.log('\n⚠️  DATABASE RESET WARNING ⚠️');
  console.log('=====================================');
  console.log('This will completely wipe your database!');
  console.log('All tables, data, and migration history will be deleted.');
  console.log('=====================================\n');

  const answer = await question('Type "RESET" to confirm (or anything else to cancel): ');
  
  if (answer.toUpperCase() !== 'RESET') {
    console.log('\n✅ Cancelled. Database was not modified.');
    rl.close();
    process.exit(0);
  }

  console.log('\n🔥 Starting database reset...\n');

  try {
    // Drop all objects in the public schema
    const resetSQL = `
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  -- Remove all triggers
  FOR r IN (
    SELECT trigger_name, event_object_table 
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public'
  ) 
  LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS ' || 
      quote_ident(r.trigger_name) || ' ON ' || 
      quote_ident(r.event_object_table) || ' CASCADE';
  END LOOP;

  -- Remove all user-defined functions (exclude extension functions)
  FOR r IN (
    SELECT proname, oid 
    FROM pg_proc 
    WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND proname NOT LIKE 'pg_%'
    AND pronamespace NOT IN (SELECT oid FROM pg_namespace WHERE nspname = 'pg_catalog')
    AND NOT EXISTS (
      SELECT 1 FROM pg_extension
      WHERE pg_extension.extnamespace = pg_proc.pronamespace
    ) 
  ) 
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || ' CASCADE';
  END LOOP;

  -- Remove ALL user-defined tables (including schema_migrations)
  FOR r IN (
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  ) 
  LOOP
    EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP;

  -- Remove all user-defined composite types
  FOR r IN (
    SELECT typname 
    FROM pg_type 
    WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND typtype = 'c'
  ) 
  LOOP
    EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
  END LOOP;
END $$;
    `;

    await db.query(resetSQL);
    
    console.log('✅ Database completely reset!\n');
    console.log('📝 Next steps:');
    console.log('   1. Run migrations: npm run migrate');
    console.log('   2. Seed test data: npm run seed\n');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
    process.exit(1);
  }

  rl.close();
  process.exit(0);
}

resetDatabase().catch(err => {
  console.error('Reset script failed:', err);
  rl.close();
  process.exit(1);
});
