import { api } from "@/lib/api";
import { ENDPOINTS } from "./endpoints";
import {
  CreateTaskRequest,
  UpdateTaskRequest,
} from "../types/api.types";

/** Объект с методами API для работы с задачами */
export const tasksApi = {
  /**
   * Получить список всех задач
   */
  getAll: () => api.get(ENDPOINTS.TASKS),

  /**
   * Получить задачу по идентификатору
   */
  getById: (id: string) => api.get(ENDPOINTS.TASK_BY_ID(id)),

  /**
   * Создать новую задачу
   */
  create: (data: CreateTaskRequest) => api.post(ENDPOINTS.TASKS, data),

  /**
   * Обновить существующую задачу
   */
  update: (id: string, data: UpdateTaskRequest) => api.put(ENDPOINTS.TASK_BY_ID(id), data),

  /**
   * Удалить задачу
   */
  delete: (id: string) => api.delete(ENDPOINTS.TASK_BY_ID(id)),

  /**
   * Массовое удаление задач
   */
  bulkDelete: (ids: string[]) => api.post(`${ENDPOINTS.TASKS}/bulk-delete`, { ids }),

  /**
   * Массовое обновление задач
   */
  bulkUpdate: (ids: string[], field: string, value: any) => 
    api.post(`${ENDPOINTS.TASKS}/bulk-update`, { ids, field, value }),

  /**
   * Получить статистику по задачам
   */
  getStats: () => api.get(ENDPOINTS.TASK_STATS),
};
