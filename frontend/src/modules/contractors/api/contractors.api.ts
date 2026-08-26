import { api } from "@/lib/api";
import { ENDPOINTS } from "./endpoints";
import {
  CreateContractorRequest,
  UpdateContractorRequest,
} from "../types/api.types";

/** Параметры запроса списка контрагентов для API */
export interface ContractorsQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  isEmployee?: boolean;
  groupId?: string;
  excludeStatus?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
}

/** Объект с методами API контрагентов */
export const contractorsApi = {
  /**
   * Получить список всех контрагентов с поддержкой фильтрации и пагинации
   */
  getAll: (params?: ContractorsQueryParams) =>
    api.get(ENDPOINTS.CONTRACTORS, { params }),

  /**
   * Получить контрагента по ID
   */
  getById: (id: number) => api.get(ENDPOINTS.CONTRACTOR_BY_ID(id)),
  
  /**
   * Создать нового контрагента
   */
  create: (data: CreateContractorRequest) => api.post(ENDPOINTS.CONTRACTORS, data),
  
  /**
   * Обновить существующего контрагента
   */
  update: (id: number, data: UpdateContractorRequest) => 
    api.put(ENDPOINTS.CONTRACTOR_BY_ID(id), data),
  
  /**
   * Удалить контрагента
   */
  delete: (id: number) => api.delete(ENDPOINTS.CONTRACTOR_BY_ID(id)),
  
  /**
   * Массовое обновление контрагентов
   */
  bulkUpdate: (data: { ids: number[]; updates: Record<string, unknown> }) =>
    api.post(ENDPOINTS.CONTRACTORS_BULK_UPDATE, data),
  
  /**
   * Массовое удаление контрагентов
   */
  bulkDelete: (ids: number[]) =>
    api.post(ENDPOINTS.CONTRACTORS_BULK_DELETE, { ids }),
  
  /**
   * Получить справочные данные для модуля контрагентов
   */
  getReferences: () => api.get(ENDPOINTS.REFERENCES),
};
