/**
 * Скрипт синхронизации: мигрирует существующие данные к новой структуре
 * - Переносит position_id из employees в employee_positions
 * - Синхронизирует роли пользователей с должностями
 * - Обновляет сотрудников без user_id (создаёт связи)
 */

const db = require('../db');

async function syncExistingData() {
  console.log('🔄 Начало синхронизации данных...');

  try {
    // 1. Проверяем, что таблица employee_positions существует
    const { rows: tableCheck } = await db.query(`
      SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'employee_positions') AS exists
    `);
    if (!tableCheck[0].exists) {
      console.error('❌ Таблица employee_positions не найдена. Сначала выполните миграцию 008.');
      process.exit(1);
    }

    // 2. Проверяем, что в positions есть колонка role
    const { rows: roleCheck } = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'positions' AND column_name = 'role'
      ) AS exists
    `);
    if (!roleCheck[0].exists) {
      console.error('❌ Колонка role в positions не найдена. Сначала выполните миграцию 007.');
      process.exit(1);
    }

    console.log('✅ Структура БД проверена');

    // 3. Переносим position_id из employees в employee_positions (если ещё не перенесены миграцией)
    const { rowCount: migratedCount } = await db.query(`
      INSERT INTO employee_positions (employee_id, position_id, is_primary)
      SELECT id, position_id, TRUE
      FROM employees
      WHERE position_id IS NOT NULL
        AND id NOT IN (SELECT employee_id FROM employee_positions)
      ON CONFLICT (employee_id, position_id) DO NOTHING
    `);
    console.log(`📦 Перенесено должностей: ${migratedCount}`);

    // 4. Синхронизируем роли пользователей с их должностями
    const { rows: usersWithPositions } = await db.query(`
      SELECT DISTINCT
        u.id AS user_id,
        u.name AS user_name,
        u.role AS current_role,
        p.role AS position_role,
        p.name AS position_name
      FROM users u
      JOIN employees e ON e.user_id = u.id
      JOIN employee_positions ep ON ep.employee_id = e.id
      JOIN positions p ON p.id = ep.position_id
      WHERE p.role IS NOT NULL
      ORDER BY u.id
    `);

    let roleSyncedCount = 0;
    for (const userRow of usersWithPositions) {
      // Берём роль из основной должности (is_primary=true) или первой попавшейся
      const { rows: primaryRoleRows } = await db.query(`
        SELECT p.role
        FROM positions p
        JOIN employee_positions ep ON ep.position_id = p.id
        JOIN employees e ON e.id = ep.employee_id
        WHERE e.user_id = $1 AND p.role IS NOT NULL
        ORDER BY ep.is_primary DESC, ep.created_at ASC
        LIMIT 1
      `, [userRow.user_id]);

      if (primaryRoleRows.length > 0 && primaryRoleRows[0].role !== userRow.current_role) {
        await db.query('UPDATE users SET role = $1 WHERE id = $2', [primaryRoleRows[0].role, userRow.user_id]);
        console.log(`  🔄 ${userRow.user_name}: роль изменена с "${userRow.current_role}" на "${primaryRoleRows[0].role}"`);
        roleSyncedCount++;
      }
    }
    console.log(`👥 Синхронизировано ролей пользователей: ${roleSyncedCount}`);

    // 5. Статистика
    const { rows: stats } = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM employees) AS total_employees,
        (SELECT COUNT(*) FROM employee_positions) AS total_position_links,
        (SELECT COUNT(*) FROM employees WHERE position_id IS NOT NULL) AS employees_with_legacy_position,
        (SELECT COUNT(*) FROM employee_positions GROUP BY employee_id HAVING COUNT(*) > 1) AS employees_with_multiple_positions,
        (SELECT COUNT(*) FROM users WHERE role IN (SELECT role FROM positions WHERE role IS NOT NULL)) AS users_with_position_role
    `);

    console.log('\n📊 Статистика после синхронизации:');
    console.log(`   Всего сотрудников: ${stats[0].total_employees}`);
    console.log(`   Связей сотрудник-должность: ${stats[0].total_position_links}`);
    console.log(`   Сотрудников с несколькими должностями: ${stats[0].employees_with_multiple_positions || 0}`);
    console.log(`   Пользователей с ролью из должности: ${stats[0].users_with_position_role}`);

    console.log('\n✅ Синхронизация завершена!');
  } catch (err) {
    console.error('❌ Ошибка синхронизации:', err.message);
    throw err;
  } finally {
    process.exit(0);
  }
}

syncExistingData();
