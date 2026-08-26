/**
 * Скрипт для получения актуальной структуры базы данных
 * Выводит информацию о таблицах, колонках, типах данных и ограничениях
 *
 * Использование:
 *   node scripts/get-db-structure.js [table_name]
 *
 * Примеры:
 *   node scripts/get-db-structure.js                    # Все таблицы
 *   node scripts/get-db-structure.js finance_invoices   # Конкретная таблица
 *   node scripts/get-db-structure.js --json             # Вывод в JSON формате
 */

const db = require('../db');
const path = require('path');
const fs = require('fs');

const TABLE_FILTERS = [
  'finance_%',
  'projects',
  'tasks',
  'contractors',
  'users',
  'calendar_events',
  'references_%',
];

/**
 * Получить список всех таблиц
 */
async function getTables() {
  const filterConditions = TABLE_FILTERS.map(f => `table_name LIKE '${f}'`).join(' OR ');
  
  const { rows } = await db.query(`
    SELECT 
      table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND (${filterConditions})
    ORDER BY table_name
  `);
  return rows;
}

/**
 * Получить колонки таблицы
 */
async function getColumns(tableName) {
  const { rows } = await db.query(`
    SELECT 
      c.column_name,
      c.data_type,
      c.character_maximum_length,
      c.numeric_precision,
      c.numeric_scale,
      c.is_nullable,
      c.column_default,
      col_description(
        (SELECT oid FROM pg_catalog.pg_class WHERE relname = c.table_name),
        c.ordinal_position
      ) AS comment
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = $1
    ORDER BY c.ordinal_position
  `, [tableName]);
  return rows;
}

/**
 * Получить внешние ключи таблицы
 */
async function getForeignKeys(tableName) {
  const { rows } = await db.query(`
    SELECT
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.update_rule,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
      AND rc.constraint_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = $1
    ORDER BY tc.constraint_name
  `, [tableName]);
  return rows;
}

/**
 * Получить индексы таблицы
 */
async function getIndexes(tableName) {
  const { rows } = await db.query(`
    SELECT
      i.relname AS index_name,
      ix.indisunique AS is_unique,
      ix.indisprimary AS is_primary,
      (SELECT array_agg(a.attname)
       FROM unnest(ix.indkey) AS k(attnum)
       JOIN pg_catalog.pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
      ) AS columns
    FROM pg_catalog.pg_class t
    JOIN pg_catalog.pg_index ix ON t.oid = ix.indrelid
    JOIN pg_catalog.pg_class i ON i.oid = ix.indexrelid
    WHERE t.relname = $1
      AND t.relkind = 'r'
    ORDER BY i.relname
  `, [tableName]);
  return rows;
}

/**
 * Получить пример данных из таблицы
 */
async function getSampleData(tableName, limit = 3) {
  try {
    const { rows } = await db.query(`SELECT * FROM ${tableName} LIMIT $1`, [limit]);
    return rows;
  } catch (e) {
    return [];
  }
}

/**
 * Получить количество записей в таблице
 */
async function getRowCount(tableName) {
  const { rows } = await db.query(`SELECT COUNT(*) as count FROM ${tableName}`);
  return rows[0]?.count || 0;
}

/**
 * Форматировать вывод
 */
function formatOutput(data, asJson = false) {
  if (asJson) {
    return JSON.stringify(data, null, 2);
  }
  
  let output = '';
  
  for (const [tableName, tableData] of Object.entries(data)) {
    output += `\n${'='.repeat(80)}\n`;
    output += `ТАБЛИЦА: ${tableName}\n`;
    output += `${'='.repeat(80)}\n`;
    
    if (tableData.description) {
      output += `Описание: ${tableData.description}\n`;
    }
    
    output += `\nЗаписей: ${tableData.rowCount}\n`;
    
    output += `\nКОЛОНКИ:\n`;
    output += `${'-'.repeat(80)}\n`;
    output += '  #  | Имя                    | Тип              | Null | Default                    | Комментарий\n';
    output += `${'-'.repeat(80)}\n`;
    
    tableData.columns.forEach((col, idx) => {
      const num = String(idx + 1).padStart(3);
      const name = (col.columnName || '').padEnd(22);
      const typeStr = col.dataType + (col.characterMaximumLength ? `(${col.characterMaximumLength})` : '') + (col.numericPrecision && !col.characterMaximumLength ? `(${col.numericPrecision},${col.numericScale || 0})` : '');
      const type = (typeStr || '').padEnd(16);
      const nullable = (col.isNullable === 'YES' ? '✓' : '✗').padEnd(4);
      const def = ((col.columnDefault || '') + '').substring(0, 26).padEnd(28);
      const comment = col.comment || '';
      
      output += `  ${num} | ${name} | ${type} | ${nullable} | ${def} | ${comment}\n`;
    });
    
    if (tableData.foreignKeys.length > 0) {
      output += `\nВНЕШНИЕ КЛЮЧИ:\n`;
      output += `${'-'.repeat(80)}\n`;
      tableData.foreignKeys.forEach(fk => {
        const columnName = fk.columnName || fk.column_name;
        const foreignTableName = fk.foreignTableName || fk.foreign_table_name;
        const foreignColumnName = fk.foreignColumnName || fk.foreign_column_name;
        const updateRule = fk.updateRule || fk.update_rule;
        const deleteRule = fk.deleteRule || fk.delete_rule;

        output += `  ${columnName} → ${foreignTableName}.${foreignColumnName}`;
        output += ` (ON UPDATE ${updateRule}, ON DELETE ${deleteRule})\n`;
      });
    }
    
    if (tableData.indexes.length > 0) {
      output += `\nИНДЕКСЫ:\n`;
      output += `${'-'.repeat(80)}\n`;
      tableData.indexes.forEach(idx => {
        const flags = [];
        if (idx.isUnique) flags.push('UNIQUE');
        if (idx.isPrimary) flags.push('PRIMARY');
        const columns = Array.isArray(idx.columns) ? idx.columns.join(', ') : idx.columns;
        output += `  ${idx.indexName} (${columns})${flags.length ? ' [' + flags.join(', ') + ']' : ''}\n`;
      });
    }
  }
  
  return output;
}

/**
 * Основная функция
 */
async function main() {
  const args = process.argv.slice(2);
  const specificTable = args.find(a => !a.startsWith('--'));
  const asJson = args.includes('--json');
  const outputFile = args.find(a => a.startsWith('--output='))?.split('=')[1];
  
  console.log('📊 Получение структуры базы данных...\n');
  
  let tables;
  
  if (specificTable) {
    tables = [{ table_name: specificTable }];
  } else {
    tables = await getTables();
  }
  
  const result = {};
  
  for (const table of tables) {
    const tableName = table.tableName || table.table_name;
    console.log(`  📋 ${tableName}...`);
    
    const [columns, foreignKeys, indexes, rowCount] = await Promise.all([
      getColumns(tableName),
      getForeignKeys(tableName),
      getIndexes(tableName),
      getRowCount(tableName),
    ]);
    
    result[tableName] = {
      description: table.description || table.tableDescription || null,
      rowCount,
      columns,
      foreignKeys,
      indexes,
    };
  }
  
  const output = formatOutput(result, asJson);
  
  if (outputFile) {
    const outputPath = path.resolve(outputFile);
    fs.writeFileSync(outputPath, output);
    console.log(`\n✅ Структура сохранена в файл: ${outputPath}`);
  } else {
    console.log(output);
  }
  
  process.exit(0);
}

// Запуск
main().catch(err => {
  console.error('❌ Ошибка:', err.message);
  console.error(err.stack);
  process.exit(1);
});
