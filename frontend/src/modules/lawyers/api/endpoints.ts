export const ENDPOINTS = {
  LAWYERS: '/lawyers',
  LAWYER_BY_ID: (id: string) => `/lawyers/${id}`,
  CASES: '/legal-cases',
  CASE_BY_ID: (id: string) => `/legal-cases/${id}`,
  COURTS: '/courts',
  JUDGES: '/courts/judges',
} as const;
