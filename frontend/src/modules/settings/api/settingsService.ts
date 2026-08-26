import { api } from "@/lib/api";
import {
  StatusItem,
  TagItem,
  PriorityItem,
  QuickAction,
  RelationshipTypeItem,
  UserSettings,
  Role,
  Permission,
} from "../types/settings.types";
import { ENDPOINTS } from "./endpoints";

export interface ReferenceDataResponse {
  statuses: StatusItem[];
  tags: TagItem[];
  priorities: PriorityItem[];
  relationshipTypes: RelationshipTypeItem[];
  contractorTypes: Array<{ id: string; name: string }>;
  taxRegimes: Array<{ id: number; name: string; code: string }>;
  marketingStatuses: StatusItem[];
  marketingTypes: Array<{ id: string; name: string; color?: string; order?: number }>;
}

export class SettingsService {
  async getReferenceData(): Promise<ReferenceDataResponse> {
    const response = await api.get('/settings/reference-data');
    return {
      statuses: response?.statuses || [],
      tags: response?.tags || [],
      priorities: response?.priorities || [],
      relationshipTypes: response?.relationshipTypes || [],
      contractorTypes: response?.contractorTypes || [],
      taxRegimes: response?.taxRegimes || [],
      marketingStatuses: response?.marketingStatuses || [],
      marketingTypes: response?.marketingTypes || [],
    };
  }

  // Statuses
  async getStatuses(): Promise<StatusItem[]> {
    const response = await api.get(ENDPOINTS.STATUSES);
    return response || [];
  }

  async createStatus(data: Omit<StatusItem, 'id'>): Promise<StatusItem> {
    return await api.post(ENDPOINTS.STATUSES, data);
  }

  async updateStatus(id: string, data: Partial<StatusItem>): Promise<StatusItem> {
    return await api.put(ENDPOINTS.STATUS_BY_ID(id), data);
  }

  async deleteStatus(id: string): Promise<void> {
    await api.delete(ENDPOINTS.STATUS_BY_ID(id));
  }

  // Tags
  async getTags(): Promise<TagItem[]> {
    const response = await api.get(ENDPOINTS.TAGS);
    return response || [];
  }

  async createTag(data: Omit<TagItem, 'id'>): Promise<TagItem> {
    return await api.post(ENDPOINTS.TAGS, data);
  }

  async updateTag(id: string, data: Partial<TagItem>): Promise<TagItem> {
    return await api.put(ENDPOINTS.TAG_BY_ID(id), data);
  }

  async deleteTag(id: string): Promise<void> {
    await api.delete(ENDPOINTS.TAG_BY_ID(id));
  }

  // Priorities
  async getPriorities(): Promise<PriorityItem[]> {
    const response = await api.get(ENDPOINTS.PRIORITIES);
    return response || [];
  }

  async createPriority(data: Omit<PriorityItem, 'id'>): Promise<PriorityItem> {
    return await api.post(ENDPOINTS.PRIORITIES, data);
  }

  async updatePriority(id: string, data: Partial<PriorityItem>): Promise<PriorityItem> {
    return await api.put(ENDPOINTS.PRIORITY_BY_ID(id), data);
  }

  async deletePriority(id: string): Promise<void> {
    await api.delete(ENDPOINTS.PRIORITY_BY_ID(id));
  }

  // Quick Actions
  async getQuickActions(): Promise<QuickAction[]> {
    const response = await api.get(ENDPOINTS.QUICK_ACTIONS);
    return response || [];
  }

  async createQuickAction(data: Omit<QuickAction, 'id'>): Promise<QuickAction> {
    return await api.post(ENDPOINTS.QUICK_ACTIONS, data);
  }

  async updateQuickAction(id: string, data: Partial<QuickAction>): Promise<QuickAction> {
    return await api.put(ENDPOINTS.QUICK_ACTION_BY_ID(id), data);
  }

  async deleteQuickAction(id: string): Promise<void> {
    await api.delete(ENDPOINTS.QUICK_ACTION_BY_ID(id));
  }

  // Relationship Types
  async getRelationshipTypes(): Promise<RelationshipTypeItem[]> {
    const response = await api.get(ENDPOINTS.RELATIONSHIP_TYPES);
    return response || [];
  }

  async createRelationshipType(data: Omit<RelationshipTypeItem, 'id'>): Promise<RelationshipTypeItem> {
    return await api.post(ENDPOINTS.RELATIONSHIP_TYPES, data);
  }

  async updateRelationshipType(id: string, data: Partial<RelationshipTypeItem>): Promise<RelationshipTypeItem> {
    return await api.put(ENDPOINTS.RELATIONSHIP_TYPE_BY_ID(id), data);
  }

  async deleteRelationshipType(id: string): Promise<void> {
    await api.delete(ENDPOINTS.RELATIONSHIP_TYPE_BY_ID(id));
  }

  // User Settings
  async getUserSettings(): Promise<UserSettings> {
    const response = await api.get(ENDPOINTS.USER_SETTINGS);
    return response || {
      theme: 'light',
      accentColor: 'blue',
      sidebarCollapsed: false,
      language: 'ru',
    };
  }

  async updateUserSetting(key: string, value: unknown): Promise<void> {
    await api.post(ENDPOINTS.USER_SETTINGS, { key, value });
  }

  // Roles
  async getRoles(): Promise<Role[]> {
    return await api.get('/roles') || [];
  }

  async createRole(data: Partial<Role>): Promise<Role> {
    return await api.post('/roles', data);
  }

  async updateRole(id: string, data: Partial<Role>): Promise<Role> {
    return await api.put(`/roles/${id}`, data);
  }

  async deleteRole(id: string): Promise<void> {
    await api.delete(`/roles/${id}`);
  }

  // Permissions
  async getPermissions(): Promise<Permission[]> {
    return await api.get('/permissions') || [];
  }
}

export const settingsService = new SettingsService();
