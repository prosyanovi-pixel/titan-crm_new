export const ENDPOINTS = {
  CONTRACTORS: '/contractors',
  CONTRACTOR_BY_ID: (id: number) => `/contractors/${id}`,
  CONTRACTORS_BULK_UPDATE: '/contractors/bulk-update',
  CONTRACTORS_BULK_DELETE: '/contractors/bulk-delete',
  CONTRACTOR_ACTIVITY_CHART: (id: number) => `/contractors/${id}/activity/chart`,
  REFERENCES: '/references',
} as const;
