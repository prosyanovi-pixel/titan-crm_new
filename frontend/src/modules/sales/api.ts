import { api } from "@/lib/api";
import { SalesDeal } from './types';

export const salesApi = {
  getPipeline: async (): Promise<SalesDeal[]> => {
    const { data } = await api.get('/projects/sales-pipeline');
    return data;
  }
};
