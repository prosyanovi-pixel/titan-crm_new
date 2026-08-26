export const ENDPOINTS = {
  FILES: '/documents',
  FILE_BY_ID: (id: string) => `/documents/${id}`,
  FOLDER_PATH: (id: string) => `/documents/path/${id}`,
  UPLOAD: '/documents/upload',
  FOLDER_STATS: '/documents/stats',
  BULK_MOVE: '/documents/bulk-move',
  BULK_RENAME: '/documents/bulk-rename',
} as const;
