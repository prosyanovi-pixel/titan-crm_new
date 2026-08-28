const fs = require('fs');
const path = require('path');
const db = require('./db');
const { compareMigrationFilenames } = require('./scripts/migrationOrdering');

function extractSQLFromMarkdown(content) {
  // Извлекаем SQL из блоков ```sql ... ``` или просто ``` ... ```
  const sqlBlocks = content.match(/```(?:sql)?\s*([\s\S]*?)```/g);
  if (sqlBlocks) {
    return sqlBlocks
      .map(block => block.replace(/```(?:sql)?\s*|```/g, ''))
      .join('\n');
  }
  // Если нет блоков, возвращаем весь файл (для простых случаев)
  return content;
}

function splitSQLStatements(sql) {
  const statements = [];
  let current = '';
  let inDoBlock = false;
  let depth = 0;
  let inDollarBlock = false;
  let dollarTag = null;
  
  const lines = sql.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (inDollarBlock) {
      current += line + '\n';
      if (dollarTag && trimmed.includes(dollarTag)) {
        inDollarBlock = false;
        dollarTag = null;
      }
      continue;
    }
    
    // Игнорируем пустые строки и комментарии
    if (!trimmed || trimmed.startsWith('--')) {
      continue;
    }
    
    // Проверяем начало/конец PL/pgSQL блока
    if (trimmed.startsWith('DO $$') || trimmed.startsWith('DO ')) {
      inDoBlock = true;
      depth = 1;
      current += line + '\n';
      continue;
    }
    
    if (inDoBlock) {
      current += line + '\n';
      
      // Проверяем конец блока (END $$)
      if (trimmed.match(/END\s*\$\$/i) || trimmed.match(/END;/i)) {
        if (trimmed.match(/END\s*\$\$/i)) {
          depth--;
          if (depth === 0) {
            statements.push(current.trim());
            current = '';
            inDoBlock = false;
          }
        }
      }
      continue;
    }
    
    // Проверяем начало dollar-quoted блока (например, CREATE FUNCTION ... $$)
    const dollarMatch = trimmed.match(/\$[A-Za-z0-9_]*\$/);
    if (dollarMatch) {
      inDollarBlock = true;
      dollarTag = dollarMatch[0];
      current += line + '\n';
      continue;
    }

    // Обычные SQL-команды (разделённые точкой с запятой)
    current += line + '\n';
    
    if (trimmed.endsWith(';')) {
      statements.push(current.trim());
      current = '';
    }
  }
  
  return statements;
}

// Создать таблицу отслеживания миграций
async function ensureMigrationsTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at 
    ON schema_migrations(applied_at);
  `;
  
  try {
    await db.query(createTableSQL);
  } catch (e) {
    console.error('Failed to create schema_migrations table:', e.message);
    throw e;
  }
}

// Ensure either pgcrypto (gen_random_uuid) or uuid-ossp is available.
// If only uuid-ossp is available, create a small wrapper gen_random_uuid() -> uuid_generate_v4().
async function ensureUuidSupport() {
  const tryCreate = async (sql) => {
    try {
      await db.query(sql);
      return true;
    } catch (e) {
      return false;
    }
  };

  // 1) Try pgcrypto first
  if (await tryCreate('CREATE EXTENSION IF NOT EXISTS pgcrypto;')) {
    console.log('🔐 pgcrypto extension is available (gen_random_uuid).');
    return;
  }

  console.warn('⚠️ Could not create pgcrypto extension (permission or not installed). Trying uuid-ossp fallback...');

  // 2) Try uuid-ossp
  if (await tryCreate('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')) {
    console.log('🔁 uuid-ossp extension is available.');

    // Check whether gen_random_uuid exists; if not, create a wrapper
    try {
      const exists = await db.query("SELECT 1 FROM pg_proc WHERE proname = 'gen_random_uuid' LIMIT 1;");
      if (!exists.rows || exists.rows.length === 0) {
        await db.query("CREATE OR REPLACE FUNCTION gen_random_uuid() RETURNS uuid AS $$ SELECT uuid_generate_v4(); $$ LANGUAGE SQL STABLE;");
        console.log('🔧 Created wrapper function gen_random_uuid() using uuid_generate_v4() from uuid-ossp');
      } else {
        console.log('gen_random_uuid() already exists.');
      }
    } catch (e) {
      console.warn('⚠️ Could not create gen_random_uuid wrapper:', e.message);
      console.warn('Migrations that rely on gen_random_uuid() may fail. Consider creating pgcrypto or wrapper manually.');
      // Fall through to final error
    }

    return;
  }

  // 3) Neither extension could be created — fail fast with clear instructions
  console.error('\n❌ Neither pgcrypto nor uuid-ossp extensions could be created. Migrations that use gen_random_uuid() will fail.');
  console.error('Possible causes: insufficient DB privileges, missing contrib packages, or managed DB restrictions.');
  console.error('Recommended actions:');
  console.error('  1) Connect as a DB superuser and run: CREATE EXTENSION IF NOT EXISTS pgcrypto;');
  console.error('  2) If pgcrypto is unavailable, try: CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  console.error('  3) If you cannot create extensions (managed DB), ask your DBA or cloud provider to enable pgcrypto or uuid-ossp.');
  process.exit(1);
}

// Получить список выполненных миграций
async function getAppliedMigrations() {
  try {
    const result = await db.query('SELECT filename FROM schema_migrations ORDER BY filename');
    return new Set(result.rows.map(row => row.filename));
  } catch (e) {
    console.error('Failed to get applied migrations:', e.message);
    throw e;
  }
}

// Записать выполненную миграцию
async function recordMigration(filename) {
  try {
    await db.query(
      'INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
      [filename]
    );
  } catch (e) {
    console.error(`Failed to record migration ${filename}:`, e.message);
    throw e;
  }
}

async function migrate() {
  const migrationsDir = path.resolve(__dirname, 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found.');
    return;
  }

  // Создать таблицу отслеживания миграций
  console.log('📋 Ensuring schema_migrations table exists...');
  await ensureMigrationsTable();

  // Ensure uuid support (pgcrypto or uuid-ossp fallback)
  await ensureUuidSupport();

  // Получить список уже выполненных миграций
  const appliedMigrations = await getAppliedMigrations();
  console.log(`📊 Found ${appliedMigrations.size} previously applied migration(s)`);

  // Читаем оба типа файлов: .sql и .md
  const files = fs.readdirSync(migrationsDir)
    .filter(f => (f.endsWith('.sql') || f.endsWith('.md')) && f !== 'README.md' && !f.startsWith('MANUAL_'))
    .sort(compareMigrationFilenames);

  if (files.length === 0) {
    console.log('No migrations to apply.');
    return;
  }

  console.log(`📂 Found ${files.length} migration file(s)`);

  // Фильтруем только новые миграции
  const pendingMigrations = files.filter(f => !appliedMigrations.has(f));
  
  if (pendingMigrations.length === 0) {
    console.log('✨ All migrations are up to date! Nothing to apply.');
    return;
  }

  console.log(`🚀 Need to apply ${pendingMigrations.length} new migration(s)\n`);

  for (const file of pendingMigrations) {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    let sql = content;
    
    // Если это .md файл, извлекаем SQL
    if (file.endsWith('.md')) {
      sql = extractSQLFromMarkdown(content);
      if (!sql || sql.trim().length === 0) {
        console.log(`⏭️  Skipping ${file} - no SQL found`);
        continue;
      }
    }

    // Разделяем SQL на отдельные команды
    const statements = splitSQLStatements(sql);

    if (statements.length === 0) {
      console.log(`⏭️  Skipping ${file} - no statements found`);
      continue;
    }

    console.log(`▶️  Applying ${file}... (${statements.length} statement(s))`);

    try {
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        await db.query(statement);
      }

      // Записать успешно выполненную миграцию
      await recordMigration(file);
      console.log(`✅ ${file} applied successfully\n`);
    } catch (e) {
      console.error(`\n❌ Migration ${file} failed:`, e.message);
      console.error('This migration has NOT been recorded as applied.');
      console.error('Fix the error and run migrations again.\n');
      process.exit(1);
    }
  }

  console.log('🎉 All migrations applied successfully!');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration runner failed:', err);
  process.exit(1);
});