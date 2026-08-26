import { api } from "@/lib/api";

export interface AllData {
  contractors?: unknown[];
  users?: unknown[];
  projects?: unknown[];
  tasks?: unknown[];
  calendarEvents?: unknown[];
  legalCases?: unknown[];
  documents?: unknown[];
  mail?: unknown[];
}

export const allDataService = {
  fetchAll: async (): Promise<AllData> => {
    const results = await Promise.allSettled([
      api.get('/contractors'),
      api.get('/users'),
      api.get('/projects'),
      api.get('/tasks'),
      api.get('/calendar/events'),
      api.get('/legal-cases'),
      api.get('/documents'),
      api.get('/mail'),
    ]);

    const map = (i: number) => {
      const res = results[i];
      if (res.status !== 'fulfilled') return undefined;
      const val = (res as PromiseFulfilledResult<any>).value;
      // Extract data if it's a paginated object { data: [], pagination: {} }
      return Array.isArray(val) ? val : (val?.data || undefined);
    };

    return {
      contractors: map(0),
      users: map(1),
      projects: map(2),
      tasks: map(3),
      calendarEvents: map(4),
      legalCases: map(5),
      documents: map(6),
      mail: map(7),
    };
  }
};

export default allDataService;
