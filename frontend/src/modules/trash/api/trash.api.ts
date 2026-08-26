import { api } from '@/lib/api';

export interface TrashItem {
  id: string | number;
  name: string;
  module: string;
  deleted_at: string;
}

export const trashApi = {
  getAll: () => api.get('/trash') as Promise<TrashItem[]>,
  restore: (module: string, id: string | number) => api.post(`/trash/${module}/${id}/restore`),
  delete: (module: string, id: string | number) => api.delete(`/trash/${module}/${id}`),
  empty: () => api.post('/trash/empty'),
};
