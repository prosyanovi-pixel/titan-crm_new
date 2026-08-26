import { api } from "@/lib/api";
import { MarketingCampaign } from "../types";

export const marketingApi = {
  getAll: (params?: any) => api.get("/marketing", { params }),
  getById: (id: string) => api.get(`/marketing/${id}`),
  create: (data: Partial<MarketingCampaign>) => api.post("/marketing", data),
  update: (id: string, data: Partial<MarketingCampaign>) => api.put(`/marketing/${id}`, data),
  delete: (id: string) => api.delete(`/marketing/${id}`),
  bulkDelete: (ids: string[]) => api.post("/marketing/bulk-delete", { ids }),
  bulkUpdate: (ids: string[], field: string, value: any) => api.post("/marketing/bulk-update", { ids, field, value }),
};
