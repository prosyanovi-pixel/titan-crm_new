/**
 * Administration Module Settings
 * Default roles, permissions, and module configuration
 */

const DEFAULT_ROLES = [
  {
    id: 'admin',
    name: 'Администратор',
    description: 'Полный доступ ко всем функциям системы',
    permissions: ['*'], // All permissions
    is_system: true,
  },
  {
    id: 'manager',
    name: 'Менеджер',
    description: 'Управление проектами, задачами, сотрудниками своего отдела',
    permissions: [
      'users:read',
      'employees:read',
      'employees:write',
      'tasks:write',
      'projects:write',
      'roles:read',
    ],
    is_system: true,
  },
  {
    id: 'user',
    name: 'Пользователь',
    description: 'Базовый доступ к системе',
    permissions: [
      'users:read:self',
      'employees:read',
      'tasks:read',
      'projects:read',
    ],
    is_system: true,
  },
  {
    id: 'contractor',
    name: 'Подрядчик',
    description: 'Ограниченный доступ для внешних подрядчиков',
    permissions: ['tasks:read', 'documents:read'],
    is_system: true,
  },
];

const DEFAULT_PERMISSIONS = [
  // Users
  { id: 'users:read', name: 'Чтение пользователей', resource: 'users', action: 'read' },
  { id: 'users:write', name: 'Создание/редактирование пользователей', resource: 'users', action: 'write' },
  { id: 'users:delete', name: 'Удаление пользователей', resource: 'users', action: 'delete' },
  { id: 'users:read:self', name: 'Чтение собственного профиля', resource: 'users', action: 'read:self' },
  
  // Employees
  { id: 'employees:read', name: 'Чтение сотрудников', resource: 'employees', action: 'read' },
  { id: 'employees:write', name: 'Создание/редактирование сотрудников', resource: 'employees', action: 'write' },
  { id: 'employees:delete', name: 'Удаление сотрудников', resource: 'employees', action: 'delete' },
  
  // Roles
  { id: 'roles:read', name: 'Чтение ролей', resource: 'roles', action: 'read' },
  { id: 'roles:write', name: 'Создание/редактирование ролей', resource: 'roles', action: 'write' },
  
  // Tasks
  { id: 'tasks:read', name: 'Чтение задач', resource: 'tasks', action: 'read' },
  { id: 'tasks:write', name: 'Создание/редактирование задач', resource: 'tasks', action: 'write' },
  
  // Projects
  { id: 'projects:read', name: 'Чтение проектов', resource: 'projects', action: 'read' },
  { id: 'projects:write', name: 'Создание/редактирование проектов', resource: 'projects', action: 'write' },
  
  // Documents
  { id: 'documents:read', name: 'Чтение документов', resource: 'documents', action: 'read' },
];

const VISIBILITY_SETTINGS = {
  users: {
    show_inactive: false,
    show_deleted: false,
  },
  employees: {
    show_inactive: false,
    show_deleted: false,
  },
};

module.exports = {
  DEFAULT_ROLES,
  DEFAULT_PERMISSIONS,
  VISIBILITY_SETTINGS,
};
