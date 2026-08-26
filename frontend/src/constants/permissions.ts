/**
 * Централизованный реестр прав доступа
 * 
 * Все права доступа должны быть определены здесь.
 * Формат: {resource}.{action}
 * 
 * Пример использования:
 * import { PERMISSIONS } from '@/constants/permissions';
 * if (hasPermission(PERMISSIONS.cases.write)) { ... }
 */

// Действия
export const ACTIONS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  ASSIGN: 'assign',
  SIGN: 'sign',
  EXPORT: 'export',
  IMPORT: 'import',
  APPROVE: 'approve',
  REJECT: 'reject',
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
  VIEW: 'view',
  PRINT: 'print',
  SHARE: 'share',
  COMMENT: 'comment',
} as const;

// Ресурсы
export const RESOURCES = {
  USERS: 'users',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  SETTINGS: 'settings',
  CONTRACTORS: 'contractors',
  PROJECTS: 'projects',
  TASKS: 'tasks',
  DOCUMENTS: 'documents',
  CASES: 'cases',
  LAWYERS: 'lawyers',
  CALENDAR: 'calendar',
  MAIL: 'mail',
  FINANCE: 'finance',
  REPORTS: 'reports',
  DASHBOARD: 'dashboard',
  PROFILE: 'profile',
  TAGS: 'tags',
  STATUSES: 'statuses',
  BACKUPS: 'backups',
  EMPLOYEES: 'employees',
  DEPARTMENTS: 'departments',
  POSITIONS: 'positions',
  CONTRACTS: 'contracts', // New resource for Contracts module
  MARKETING: 'marketing',
  TEMPLATES: 'templates',
} as const;

// Helper для создания полного ID права
const perm = (resource: string, action: string) => `${resource}.${action}`;

/**
 * Все права доступа
 */
export const PERMISSIONS = {
  // Пользователи
  users: {
    read: perm(RESOURCES.USERS, ACTIONS.READ),
    write: perm(RESOURCES.USERS, ACTIONS.WRITE),
    delete: perm(RESOURCES.USERS, ACTIONS.DELETE),
    assign: perm(RESOURCES.USERS, ACTIONS.ASSIGN),
  },
  
  // Роли
  roles: {
    read: perm(RESOURCES.ROLES, ACTIONS.READ),
    write: perm(RESOURCES.ROLES, ACTIONS.WRITE),
    delete: perm(RESOURCES.ROLES, ACTIONS.DELETE),
  },
  
  // Права доступа
  permissions: {
    read: perm(RESOURCES.PERMISSIONS, ACTIONS.READ),
    write: perm(RESOURCES.PERMISSIONS, ACTIONS.WRITE),
    delete: perm(RESOURCES.PERMISSIONS, ACTIONS.DELETE),
  },
  
  // Настройки
  settings: {
    read: perm(RESOURCES.SETTINGS, ACTIONS.READ),
    write: perm(RESOURCES.SETTINGS, ACTIONS.WRITE),
  },
  
  // Контрагенты
  contractors: {
    read: perm(RESOURCES.CONTRACTORS, ACTIONS.READ),
    write: perm(RESOURCES.CONTRACTORS, ACTIONS.WRITE),
    delete: perm(RESOURCES.CONTRACTORS, ACTIONS.DELETE),
    export: perm(RESOURCES.CONTRACTORS, ACTIONS.EXPORT),
  },
  
  // Проекты
  projects: {
    read: perm(RESOURCES.PROJECTS, ACTIONS.READ),
    write: perm(RESOURCES.PROJECTS, ACTIONS.WRITE),
    delete: perm(RESOURCES.PROJECTS, ACTIONS.DELETE),
  },
  
  // Задачи
  tasks: {
    read: perm(RESOURCES.TASKS, ACTIONS.READ),
    write: perm(RESOURCES.TASKS, ACTIONS.WRITE),
    delete: perm(RESOURCES.TASKS, ACTIONS.DELETE),
    assign: perm(RESOURCES.TASKS, ACTIONS.ASSIGN),
  },
  
  // Документы
  documents: {
    read: perm(RESOURCES.DOCUMENTS, ACTIONS.READ),
    write: perm(RESOURCES.DOCUMENTS, ACTIONS.WRITE),
    delete: perm(RESOURCES.DOCUMENTS, ACTIONS.DELETE),
    sign: perm(RESOURCES.DOCUMENTS, ACTIONS.SIGN),
    export: perm(RESOURCES.DOCUMENTS, ACTIONS.EXPORT),
  },
  
  // Дела (cases)
  cases: {
    read: perm(RESOURCES.CASES, ACTIONS.READ),
    write: perm(RESOURCES.CASES, ACTIONS.WRITE),
    delete: perm(RESOURCES.CASES, ACTIONS.DELETE),
    assign: perm(RESOURCES.CASES, ACTIONS.ASSIGN),
  },
  
  // Юристы
  lawyers: {
    read: perm(RESOURCES.LAWYERS, ACTIONS.READ),
    write: perm(RESOURCES.LAWYERS, ACTIONS.WRITE),
    delete: perm(RESOURCES.LAWYERS, ACTIONS.DELETE),
    assign: perm(RESOURCES.LAWYERS, ACTIONS.ASSIGN),
  },
  
  // Календарь
  calendar: {
    read: perm(RESOURCES.CALENDAR, ACTIONS.READ),
    write: perm(RESOURCES.CALENDAR, ACTIONS.WRITE),
    delete: perm(RESOURCES.CALENDAR, ACTIONS.DELETE),
  },
  
  // Почта
  mail: {
    read: perm(RESOURCES.MAIL, ACTIONS.READ),
    write: perm(RESOURCES.MAIL, ACTIONS.WRITE),
    delete: perm(RESOURCES.MAIL, ACTIONS.DELETE),
    send: perm(RESOURCES.MAIL, 'send'),
  },
  
  // Финансы
  finance: {
    read: perm(RESOURCES.FINANCE, ACTIONS.READ),
    write: perm(RESOURCES.FINANCE, ACTIONS.WRITE),
    delete: perm(RESOURCES.FINANCE, ACTIONS.DELETE),
    approve: perm(RESOURCES.FINANCE, ACTIONS.APPROVE),
  },
  
  // Отчёты
  reports: {
    read:   perm(RESOURCES.REPORTS, ACTIONS.READ),
    write:  perm(RESOURCES.REPORTS, ACTIONS.WRITE),
    export: perm(RESOURCES.REPORTS, ACTIONS.EXPORT),
  },
  
  // Дашборд
  dashboard: {
    read: perm(RESOURCES.DASHBOARD, ACTIONS.READ),
  },
  
  // Профиль
  profile: {
    read: perm(RESOURCES.PROFILE, ACTIONS.READ),
    write: perm(RESOURCES.PROFILE, ACTIONS.WRITE),
  },
  
  // Теги
  tags: {
    read: perm(RESOURCES.TAGS, ACTIONS.READ),
    write: perm(RESOURCES.TAGS, ACTIONS.WRITE),
    delete: perm(RESOURCES.TAGS, ACTIONS.DELETE),
  },
  
  // Статусы
  statuses: {
    read: perm(RESOURCES.STATUSES, ACTIONS.READ),
    write: perm(RESOURCES.STATUSES, ACTIONS.WRITE),
    delete: perm(RESOURCES.STATUSES, ACTIONS.DELETE),
  },
  
  // Бэкапы
  backups: {
    read: perm(RESOURCES.BACKUPS, ACTIONS.READ),
    write: perm(RESOURCES.BACKUPS, ACTIONS.WRITE),
    delete: perm(RESOURCES.BACKUPS, ACTIONS.DELETE),
  },
  
  // Сотрудники
  employees: {
    read: perm(RESOURCES.EMPLOYEES, ACTIONS.READ),
    write: perm(RESOURCES.EMPLOYEES, ACTIONS.WRITE),
    delete: perm(RESOURCES.EMPLOYEES, ACTIONS.DELETE),
  },

  // Отделы
  departments: {
    read: perm(RESOURCES.DEPARTMENTS, ACTIONS.READ),
    write: perm(RESOURCES.DEPARTMENTS, ACTIONS.WRITE),
    delete: perm(RESOURCES.DEPARTMENTS, ACTIONS.DELETE),
  },

  // Должности
  positions: {
    read: perm(RESOURCES.POSITIONS, ACTIONS.READ),
    write: perm(RESOURCES.POSITIONS, ACTIONS.WRITE),
    delete: perm(RESOURCES.POSITIONS, ACTIONS.DELETE),
  },

  // Контракты
  contracts: {
    read: perm(RESOURCES.CONTRACTS, ACTIONS.READ),
    write: perm(RESOURCES.CONTRACTS, ACTIONS.WRITE),
    delete: perm(RESOURCES.CONTRACTS, ACTIONS.DELETE),
  },

  // Маркетинг
  marketing: {
    read: perm(RESOURCES.MARKETING, ACTIONS.READ),
    write: perm(RESOURCES.MARKETING, ACTIONS.WRITE),
    delete: perm(RESOURCES.MARKETING, ACTIONS.DELETE),
  },

  // Шаблоны
  templates: {
    read: perm(RESOURCES.TEMPLATES, ACTIONS.READ),
    write: perm(RESOURCES.TEMPLATES, ACTIONS.WRITE),
    delete: perm(RESOURCES.TEMPLATES, ACTIONS.DELETE),
  },
} as const;

/**
 * Тип всех прав доступа
 */
export type PermissionId = typeof PERMISSIONS[keyof typeof PERMISSIONS][keyof typeof PERMISSIONS[keyof typeof PERMISSIONS]];

/**
 * Получение всех ID прав как массив строк
 */
export const getAllPermissionIds = (): string[] => {
  return Object.values(PERMISSIONS).flatMap(resource =>
    Object.values(resource)
  );
};

/**
 * Получение прав для конкретного ресурса
 */
export const getResourcePermissions = (resource: string): string[] => {
  const resourcePerms = (PERMISSIONS as any)[resource];
  if (!resourcePerms) return [];
  return Object.values(resourcePerms);
};
