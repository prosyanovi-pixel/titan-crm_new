import { api } from "@/lib/api";
import { Task, TaskFilters } from "../types/task.types";
import {
  CreateTaskRequest,
  UpdateTaskRequest,
} from "../types/api.types";
import { ENDPOINTS } from "./endpoints";

/** Сервис для работы с API задач */
export class TaskService {
  /**
   * Получить список всех задач
   */
  async getAll(): Promise<Task[]> {
    const response = await api.get(ENDPOINTS.TASKS);
    return response || [];
  }

  /**
   * Получить задачу по ID
   * @param id - Идентификатор задачи
   */
  async getById(id: string): Promise<Task | null> {
    const response = await api.get(ENDPOINTS.TASK_BY_ID(id));
    return response || null;
  }

  /**
   * Создать новую задачу
   * @param data - Данные задачи
   */
  async create(data: CreateTaskRequest): Promise<Task> {
    const response = await api.post(ENDPOINTS.TASKS, data);
    return response;
  }

  /**
   * Обновить данные задачи
   * @param id - Идентификатор задачи
   * @param data - Обновляемые данные
   */
  async update(id: string, data: UpdateTaskRequest): Promise<Task> {
    const response = await api.put(ENDPOINTS.TASK_BY_ID(id), data);
    return response;
  }

  /**
   * Удалить задачу
   * @param id - Идентификатор задачи
   */
  async delete(id: string): Promise<void> {
    await api.delete(ENDPOINTS.TASK_BY_ID(id));
  }

  /**
   * Получить статистику по задачам
   */
  async getStats(): Promise<Record<string, unknown>> {
    const response = await api.get(ENDPOINTS.TASK_STATS);
    return response || {};
  }
}

export const taskService = new TaskService();
