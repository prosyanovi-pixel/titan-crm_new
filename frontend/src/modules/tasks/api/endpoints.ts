export const ENDPOINTS = {
  TASKS: '/tasks',
  TASK_BY_ID: (id: string) => `/tasks/${id}`,
  TASK_STATS: '/tasks/stats',
} as const;
