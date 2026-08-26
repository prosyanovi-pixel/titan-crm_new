export const ENDPOINTS = {
  STATUSES: '/settings/statuses',
  STATUS_BY_ID: (id: string) => `/settings/statuses/${id}`,
  TAGS: '/settings/tags',
  TAG_BY_ID: (id: string) => `/settings/tags/${id}`,
  PRIORITIES: '/settings/priorities',
  PRIORITY_BY_ID: (id: string) => `/settings/priorities/${id}`,
  QUICK_ACTIONS: '/quick-actions',
  QUICK_ACTION_BY_ID: (id: string) => `/quick-actions/${id}`,
  RELATIONSHIP_TYPES: '/relationship-types',
  RELATIONSHIP_TYPE_BY_ID: (id: string) => `/relationship-types/${id}`,
  USER_SETTINGS: '/user-settings',
  CONTRACTOR_TYPES: '/contractor-types',
  LEGAL_FORMS: '/legal-forms',
  // Module Settings
  MODULE_SETTINGS: '/module-settings',
  MODULE_SETTINGS_BY_ID: (moduleId: string) => `/module-settings/${moduleId}`,
  MODULE_SETTINGS_KEY: (moduleId: string, key: string) => `/module-settings/${moduleId}/${key}`,
} as const;
