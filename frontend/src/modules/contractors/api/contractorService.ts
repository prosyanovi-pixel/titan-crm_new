import { api } from "@/lib/api";
import { Contractor, ReferenceData } from "../types/contractor.types";
import {
  CreateContractorRequest,
  UpdateContractorRequest,
} from "../types/api.types";
import { ENDPOINTS } from "./endpoints";
import { ContractorsQueryParams } from "./contractors.api";

/** Пагинированный ответ API списка контрагентов */
export interface ContractorsPaginatedResponse {
  data: Contractor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Сервис для работы с API контрагентов */
export class ContractorService {
  /**
   * Получить список контрагентов с серверной пагинацией/фильтрацией
   * @param params - Параметры запроса (поиск, страница, лимит)
   * @returns Пагинированный список контрагентов
   */
  async getAll(params?: ContractorsQueryParams): Promise<ContractorsPaginatedResponse> {
    const response = await api.get(ENDPOINTS.CONTRACTORS, { params });
    // API возвращает { data: [...], pagination: {...} }
    if (response?.pagination) {
      return response as ContractorsPaginatedResponse;
    }
    // Fallback для обратной совместимости
    const data = response?.data || response || [];
    return {
      data,
      pagination: {
        page: params?.page || 1,
        limit: params?.limit || 50,
        total: data.length,
        totalPages: 1,
      },
    };
  }

  /**
   * Получить контрагента по ID
   * @param id - Идентификатор контрагента
   * @returns Данные контрагента или null
   */
  async getById(id: number): Promise<Contractor | null> {
    const response = await api.get(ENDPOINTS.CONTRACTOR_BY_ID(id));
    // API может вернуть { data: {...} } или просто объект
    return response?.data || response || null;
  }

  /**
   * Создать нового контрагента
   * @param data - Данные для создания
   * @returns Созданный контрагент
   */
  async create(data: CreateContractorRequest): Promise<Contractor> {
    const response = await api.post(ENDPOINTS.CONTRACTORS, data);
    return response?.data || response;
  }

  /**
   * Обновить данные контрагента
   * @param id - Идентификатор контрагента
   * @param data - Обновляемые данные
   * @returns Обновлённый контрагент
   */
  async update(id: number, data: UpdateContractorRequest): Promise<Contractor> {
    const response = await api.put(ENDPOINTS.CONTRACTOR_BY_ID(id), data);
    return response?.data || response;
  }

  /**
   * Удалить контрагента
   * @param id - Идентификатор контрагента
   */
  async delete(id: number): Promise<void> {
    await api.delete(ENDPOINTS.CONTRACTOR_BY_ID(id));
  }

  /**
   * Получить справочные данные модуля контрагентов
   * @returns Объект ReferenceData со справочниками
   */
  async getReferences(): Promise<ReferenceData> {
    const response = await api.get(ENDPOINTS.REFERENCES);
    return response?.data || response || {
      projectStatuses: [],
      priorities: [],
      managers: [],
      contractorTypes: [],
      legalForms: [],
    };
  }

  /**
   * Получить данные для графика активности контрагента
   */
  async getActivityChart(id: number): Promise<{ name: string; value: number }[]> {
    const response = await api.get(ENDPOINTS.CONTRACTOR_ACTIVITY_CHART(id));
    return response?.data || response || [];
  }
}

/** Единственный экземпляр ContractorService */
export const contractorService = new ContractorService();
