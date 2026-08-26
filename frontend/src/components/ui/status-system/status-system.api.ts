/**
 * API для управления статусами, тегами и приоритетами
 *
 * Все настройки хранятся в базе данных и могут быть изменены через Settings
 */

import { api } from '@/lib/api';
import type {
  Status,
  Tag,
  Priority,
  Outcome,
  StatusCreateRequest,
  StatusUpdateRequest,
  TagCreateRequest,
  TagUpdateRequest,
  PriorityCreateRequest,
  PriorityUpdateRequest,
  OutcomeCreateRequest,
  OutcomeUpdateRequest,
  EntitiesResponse,
} from './types';

// ─── Status API ─────────────────────────────────────────────────────────────

/**
 * Получить все статусы
 */
export async function get_statuses(module?: string): Promise<Status[]> {
  const url = module ? `/statuses?module=${encodeURIComponent(module)}` : '/statuses';
  const response = await api.get(url) as EntitiesResponse<Status>;
  return response.items || [];
}

/**
 * Получить статус по ID
 */
export async function get_status_by_id(id: string): Promise<Status> {
  return api.get(`/statuses/${id}`) as Promise<Status>;
}

/**
 * Создать новый статус
 */
export async function create_status(data: StatusCreateRequest): Promise<Status> {
  return api.post('/statuses', data) as Promise<Status>;
}

/**
 * Обновить статус
 */
export async function update_status(data: StatusUpdateRequest): Promise<Status> {
  return api.put(`/statuses/${data.id}`, data) as Promise<Status>;
}

/**
 * Удалить статус
 */
export async function delete_status(id: string): Promise<void> {
  return api.delete(`/statuses/${id}`);
}

/**
 * Обновить порядок статусов
 */
export async function reorder_statuses(ids: string[]): Promise<Status[]> {
  return api.put('/statuses/reorder', { ids }) as Promise<Status[]>;
}

// ─── Tag API ─────────────────────────────────────────────────────────────

/**
 * Получить все теги
 */
export async function get_tags(module?: string): Promise<Tag[]> {
  const url = module ? `/tags?module=${encodeURIComponent(module)}` : '/tags';
  const response = await api.get(url) as EntitiesResponse<Tag>;
  return response.items || [];
}

/**
 * Получить тег по ID
 */
export async function get_tag_by_id(id: string): Promise<Tag> {
  return api.get(`/tags/${id}`) as Promise<Tag>;
}

/**
 * Создать новый тег
 */
export async function create_tag(data: TagCreateRequest): Promise<Tag> {
  return api.post('/tags', data) as Promise<Tag>;
}

/**
 * Обновить тег
 */
export async function update_tag(data: TagUpdateRequest): Promise<Tag> {
  return api.put(`/tags/${data.id}`, data) as Promise<Tag>;
}

/**
 * Удалить тег
 */
export async function delete_tag(id: string): Promise<void> {
  return api.delete(`/tags/${id}`);
}

// ─── Priority API ─────────────────────────────────────────────────────────────

/**
 * Получить все приоритеты
 */
export async function get_priorities(): Promise<Priority[]> {
  const response = await api.get('/priorities') as EntitiesResponse<Priority>;
  return response.items || [];
}

/**
 * Получить приоритет по ID
 */
export async function get_priority_by_id(id: string): Promise<Priority> {
  return api.get(`/priorities/${id}`) as Promise<Priority>;
}

/**
 * Создать новый приоритет
 */
export async function create_priority(data: PriorityCreateRequest): Promise<Priority> {
  return api.post('/priorities', data) as Promise<Priority>;
}

/**
 * Обновить приоритет
 */
export async function update_priority(data: PriorityUpdateRequest): Promise<Priority> {
  return api.put(`/priorities/${data.id}`, data) as Promise<Priority>;
}

/**
 * Удалить приоритет
 */
export async function delete_priority(id: string): Promise<void> {
  return api.delete(`/priorities/${id}`);
}

/**
 * Обновить порядок приоритетов
 */
export async function reorder_priorities(ids: string[]): Promise<Priority[]> {
  return api.put('/priorities/reorder', { ids }) as Promise<Priority[]>;
}

// ─── Outcome API ─────────────────────────────────────────────────────────────

/**
 * Получить все результаты дел
 */
export async function get_outcomes(): Promise<Outcome[]> {
  const response = await api.get('/case-outcomes') as EntitiesResponse<Outcome>;
  return response.items || [];
}

/**
 * Получить результат по ID
 */
export async function get_outcome_by_id(id: string): Promise<Outcome> {
  return api.get(`/case-outcomes/${id}`) as Promise<Outcome>;
}

/**
 * Создать новый результат
 */
export async function create_outcome(data: OutcomeCreateRequest): Promise<Outcome> {
  return api.post('/case-outcomes', data) as Promise<Outcome>;
}

/**
 * Обновить результат
 */
export async function update_outcome(data: OutcomeUpdateRequest): Promise<Outcome> {
  return api.put(`/case-outcomes/${data.id}`, data) as Promise<Outcome>;
}

/**
 * Удалить результат
 */
export async function delete_outcome(id: string): Promise<void> {
  return api.delete(`/case-outcomes/${id}`);
}

/**
 * Обновить порядок результатов
 */
export async function reorder_outcomes(ids: string[]): Promise<Outcome[]> {
  return api.put('/case-outcomes/reorder', { ids }) as Promise<Outcome[]>;
}

// ─── Bulk Operations ─────────────────────────────────────────────────────────────

/**
 * Массовое обновление цветов
 */
export interface BulkColorUpdate {
  id: string;
  color: string;
}

export async function bulk_update_status_colors(updates: BulkColorUpdate[]): Promise<Status[]> {
  return api.put('/statuses/bulk-colors', { updates }) as Promise<Status[]>;
}

export async function bulk_update_tag_colors(updates: BulkColorUpdate[]): Promise<Tag[]> {
  return api.put('/tags/bulk-colors', { updates }) as Promise<Tag[]>;
}

export async function bulk_update_priority_colors(updates: BulkColorUpdate[]): Promise<Priority[]> {
  return api.put('/priorities/bulk-colors', { updates }) as Promise<Priority[]>;
}
