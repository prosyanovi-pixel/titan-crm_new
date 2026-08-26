/**
 * Скрипт проверки и сброса ролей/прав доступа
 * 
 * Использование:
 *   node scripts/check-permissions.js          # Проверка текущего состояния
 *   node scripts/check-permissions.js --reset  # Сброс ролей и прав к значениям по умолчанию
 */

const db = require('../db');

const DEFAULT_ROLES = [
  {
    id: 'admin',
    name: 'Администратор',
    description: 'Полный доступ ко всем функциям системы',
    permissions: [
      'users.*', 'roles.*', 'permissions.*', 'settings.*',
      'contractors.*', 'projects.*', 'tasks.*', 'documents.*',
      'cases.*', 'lawyers.*', 'finance.*', 'calendar.*',
      'mail.*', 'reports.*', 'backups.*'
    ]
  },
  {
    id: 'manager',
    name: 'Менеджер',
    description: 'Управление проектами, клиентами и задачами',
    permissions: [
      'contractors.read', 'contractors.write', 'contractors.delete',
      'projects.*', 'tasks.*', 'documents.*',
      'cases.read', 'cases.write',
      'calendar.*', 'mail.*', 'reports.read'
    ]
  },
  {
    id: 'lawyer',
    name: 'Юрист',
    description: 'Работа с юридическими делами и документами',
    permissions: [
      'contractors.read', 'projects.read',
      'tasks.read', 'tasks.write', 'documents.*',
      'cases.*', 'calendar.*', 'mail.read', 'mail.write'
    ]
  },
  {
    id: 'accountant',
    name: 'Бухгалтер',
    description: 'Доступ к финансовым данным и отчётам',
    permissions: [
      'contractors.read', 'projects.read', 'documents.read',
      'cases.read', 'reports.read', 'reports.write'
    ]
  },
  {
    id: 'user',
    name: 'Пользователь',
    description: 'Базовый доступ к функциям',
    permissions: [
      'contractors.read', 'projects.read',
      'tasks.read', 'tasks.write', 'documents.read',
      'calendar.read', 'mail.read', 'mail.write'
    ]
  },
  {
    id: 'viewer',
    name: 'Наблюдатель',
    description: 'Только просмотр без возможности изменения',
    permissions: [
      'contractors.read', 'projects.read', 'tasks.read',
      'documents.read', 'cases.read', 'calendar.read'
    ]
  }
];

const DEFAULT_PERMISSIONS = [
  // Users
  { id: 'users.read', name: 'Просмотр пользователей', category: 'users', resource: 'users', action: 'read', description: 'Просмотр списка пользователей' },
  { id: 'users.write', name: 'Управление пользователями', category: 'users', resource: 'users', action: 'write', description: 'Создание и редактирование пользователей' },
  { id: 'users.delete', name: 'Удаление пользователей', category: 'users', resource: 'users', action: 'delete', description: 'Удаление пользователей из системы' },
  // Roles
  { id: 'roles.read', name: 'Просмотр ролей', category: 'roles', resource: 'roles', action: 'read', description: 'Просмотр списка ролей' },
  { id: 'roles.write', name: 'Управление ролями', category: 'roles', resource: 'roles', action: 'write', description: 'Создание и редактирование ролей' },
  { id: 'roles.delete', name: 'Удаление ролей', category: 'roles', resource: 'roles', action: 'delete', description: 'Удаление ролей из системы' },
  // Permissions
  { id: 'permissions.read', name: 'Просмотр прав доступа', category: 'permissions', resource: 'permissions', action: 'read', description: 'Просмотр прав доступа' },
  { id: 'permissions.write', name: 'Управление правами доступа', category: 'permissions', resource: 'permissions', action: 'write', description: 'Создание и редактирование прав доступа' },
  { id: 'permissions.delete', name: 'Удаление прав доступа', category: 'permissions', resource: 'permissions', action: 'delete', description: 'Удаление прав доступа' },
  // Settings
  { id: 'settings.read', name: 'Просмотр настроек', category: 'settings', resource: 'settings', action: 'read', description: 'Просмотр системных настроек' },
  { id: 'settings.write', name: 'Управление настройками', category: 'settings', resource: 'settings', action: 'write', description: 'Изменение системных настроек' },
  // Contractors
  { id: 'contractors.read', name: 'Просмотр контрагентов', category: 'contractors', resource: 'contractors', action: 'read', description: 'Просмотр списка контрагентов' },
  { id: 'contractors.write', name: 'Управление контрагентами', category: 'contractors', resource: 'contractors', action: 'write', description: 'Создание и редактирование контрагентов' },
  { id: 'contractors.delete', name: 'Удаление контрагентов', category: 'contractors', resource: 'contractors', action: 'delete', description: 'Удаление контрагентов' },
  // Projects
  { id: 'projects.read', name: 'Просмотр проектов', category: 'projects', resource: 'projects', action: 'read', description: 'Просмотр списка проектов' },
  { id: 'projects.write', name: 'Управление проектами', category: 'projects', resource: 'projects', action: 'write', description: 'Создание и редактирование проектов' },
  { id: 'projects.delete', name: 'Удаление проектов', category: 'projects', resource: 'projects', action: 'delete', description: 'Удаление проектов' },
  // Tasks
  { id: 'tasks.read', name: 'Просмотр задач', category: 'tasks', resource: 'tasks', action: 'read', description: 'Просмотр списка задач' },
  { id: 'tasks.write', name: 'Управление задачами', category: 'tasks', resource: 'tasks', action: 'write', description: 'Создание и редактирование задач' },
  { id: 'tasks.delete', name: 'Удаление задач', category: 'tasks', resource: 'tasks', action: 'delete', description: 'Удаление задач' },
  // Documents
  { id: 'documents.read', name: 'Просмотр документов', category: 'documents', resource: 'documents', action: 'read', description: 'Просмотр документов' },
  { id: 'documents.write', name: 'Управление документами', category: 'documents', resource: 'documents', action: 'write', description: 'Создание и редактирование документов' },
  { id: 'documents.delete', name: 'Удаление документов', category: 'documents', resource: 'documents', action: 'delete', description: 'Удаление документов' },
  { id: 'documents.upload', name: 'Загрузка документов', category: 'documents', resource: 'documents', action: 'upload', description: 'Загрузка файлов в систему' },
  // Cases
  { id: 'cases.read', name: 'Просмотр дел', category: 'cases', resource: 'cases', action: 'read', description: 'Просмотр юридических дел' },
  { id: 'cases.write', name: 'Управление делами', category: 'cases', resource: 'cases', action: 'write', description: 'Создание и редактирование дел' },
  { id: 'cases.delete', name: 'Удаление дел', category: 'cases', resource: 'cases', action: 'delete', description: 'Удаление дел' },
  { id: 'cases.assign', name: 'Назначение дел', category: 'cases', resource: 'cases', action: 'assign', description: 'Назначение ответственных за дела' },
  // Lawyers
  { id: 'lawyers.read', name: 'Просмотр юристов', category: 'lawyers', resource: 'lawyers', action: 'read', description: 'Просмотр списка юристов' },
  { id: 'lawyers.write', name: 'Управление юристами', category: 'lawyers', resource: 'lawyers', action: 'write', description: 'Создание и редактирование юристов' },
  { id: 'lawyers.delete', name: 'Удаление юристов', category: 'lawyers', resource: 'lawyers', action: 'delete', description: 'Удаление юристов' },
  { id: 'lawyers.assign', name: 'Назначение юристов', category: 'lawyers', resource: 'lawyers', action: 'assign', description: 'Назначение юристов на дела' },
  // Calendar
  { id: 'calendar.read', name: 'Просмотр календаря', category: 'calendar', resource: 'calendar', action: 'read', description: 'Просмотр событий календаря' },
  { id: 'calendar.write', name: 'Управление календарём', category: 'calendar', resource: 'calendar', action: 'write', description: 'Создание и редактирование событий' },
  { id: 'calendar.delete', name: 'Удаление событий', category: 'calendar', resource: 'calendar', action: 'delete', description: 'Удаление событий календаря' },
  // Mail
  { id: 'mail.read', name: 'Просмотр почты', category: 'mail', resource: 'mail', action: 'read', description: 'Просмотр писем' },
  { id: 'mail.write', name: 'Управление почтой', category: 'mail', resource: 'mail', action: 'write', description: 'Создание и отправка писем' },
  { id: 'mail.delete', name: 'Удаление почты', category: 'mail', resource: 'mail', action: 'delete', description: 'Удаление писем' },
  // Reports
  { id: 'reports.read', name: 'Просмотр отчётов', category: 'reports', resource: 'reports', action: 'read', description: 'Просмотр отчётов и статистики' },
  { id: 'reports.write', name: 'Создание отчётов', category: 'reports', resource: 'reports', action: 'write', description: 'Создание пользовательских отчётов' },
  { id: 'reports.export', name: 'Экспорт отчётов', category: 'reports', resource: 'reports', action: 'export', description: 'Экспорт отчётов в различные форматы' },
  // Finance
  { id: 'finance.read', name: 'Просмотр финансов', category: 'finance', resource: 'finance', action: 'read', description: 'Просмотр финансовых данных' },
  { id: 'finance.write', name: 'Управление финансами', category: 'finance', resource: 'finance', action: 'write', description: 'Создание и редактирование финансовых записей' },
  { id: 'finance.delete', name: 'Удаление финансовых записей', category: 'finance', resource: 'finance', action: 'delete', description: 'Удаление финансовых записей' },
  // Backups
  { id: 'backups.read', name: 'Просмотр резервных копий', category: 'backups', resource: 'backups', action: 'read', description: 'Просмотр резервных копий' },
  { id: 'backups.write', name: 'Создание резервных копий', category: 'backups', resource: 'backups', action: 'write', description: 'Создание резервных копий' },
  { id: 'backups.delete', name: 'Удаление резервных копий', category: 'backups', resource: 'backups', action: 'delete', description: 'Удаление резервных копий' },
];

/**
 * Проверка текущего состояния
 */
async function checkPermissions() {
  try {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║       ПРОВЕРКА СИСТЕМЫ ПРАВ ДОСТУПА       ║');
    console.log('╚══════════════════════════════════════════╝\n');

    // Пользователи и роли
    const { rows: users } = await db.query(`
      SELECT u.id, u.name, u.email, u.role, r.name as role_name, r.permissions
      FROM users u
      LEFT JOIN roles r ON r.id = u.role
      ORDER BY u.id
    `);

    console.log('👥 Пользователи и их роли:');
    console.log('─'.repeat(50));
    for (const user of users) {
      const hasRole = user.role_name ? '✓' : '❌';
      console.log(`  ${hasRole} ID: ${user.id}, Name: ${user.name}`);
      console.log(`     Role: ${user.role} → ${user.role_name || 'НЕ НАЙДЕНА'}`);
      if (user.permissions) {
        const perms = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
        console.log(`     Permissions: ${perms.length} прав`);
      }
    }

    // Роли
    const { rows: roles } = await db.query('SELECT id, name, permissions FROM roles ORDER BY id');
    console.log('\n🔐 Роли в БД:');
    console.log('─'.repeat(50));
    for (const role of roles) {
      let perms = role.permissions;
      if (typeof perms === 'string') perms = JSON.parse(perms);
      console.log(`  • ${role.id} (${role.name}): ${perms.length} прав`);
    }

    // Права
    const { rows: permissions } = await db.query('SELECT id, category FROM permissions ORDER BY category, id');
    console.log(`\n📋 Права доступа: ${permissions.length}`);
    
    // Группировка по категориям
    const byCategory = permissions.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {});
    
    for (const [cat, count] of Object.entries(byCategory)) {
      console.log(`  • ${cat}: ${count}`);
    }

    console.log('\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Ошибка:', err.message);
    process.exit(1);
  }
}

/**
 * Сброс ролей и прав к значениям по умолчанию
 */
async function resetPermissions() {
  try {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║       СБРОС ПРАВ ДОСТУПА К ДЕФОЛТУ        ║');
    console.log('╚══════════════════════════════════════════╝\n');

    // Сброс прав
    console.log('🗑  Очистка существующих прав...');
    await db.query('DELETE FROM permissions');
    
    console.log('➕ Вставка прав по умолчанию...');
    for (const perm of DEFAULT_PERMISSIONS) {
      await db.query(
        `INSERT INTO permissions (id, name, description, category, resource, action)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [perm.id, perm.name, perm.description, perm.category, perm.resource, perm.action]
      );
    }
    console.log(`  ✓ Добавлено ${DEFAULT_PERMISSIONS.length} прав`);

    // Сброс ролей
    console.log('\n🔄 Сброс ролей...');
    for (const role of DEFAULT_ROLES) {
      await db.query(
        `INSERT INTO roles (id, name, description, permissions)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           permissions = EXCLUDED.permissions`,
        [role.id, role.name, role.description, JSON.stringify(role.permissions)]
      );
      console.log(`  ✓ ${role.id} (${role.name}): ${role.permissions.length} прав`);
    }

    console.log('\n✅ Сброс завершён!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Ошибка:', err.message);
    process.exit(1);
  }
}

// Main
const args = process.argv.slice(2);
if (args.includes('--reset') || args.includes('-r')) {
  resetPermissions();
} else {
  checkPermissions();
}
