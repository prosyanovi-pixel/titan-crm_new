import { api } from "@/lib/api";
import { ENDPOINTS } from "./endpoints";

type SettingsPayload = Record<string, unknown>;

export const settingsApi = {
  getReferenceData: () => api.get('/settings/reference-data'),

  // Statuses
  getStatuses: () => api.get(ENDPOINTS.STATUSES),
  createStatus: (data: SettingsPayload) => api.post(ENDPOINTS.STATUSES, data),
  updateStatus: (id: string, data: SettingsPayload) => api.put(ENDPOINTS.STATUS_BY_ID(id), data),
  deleteStatus: (id: string) => api.delete(ENDPOINTS.STATUS_BY_ID(id)),

  // Tags
  getTags: () => api.get(ENDPOINTS.TAGS),
  createTag: (data: SettingsPayload) => api.post(ENDPOINTS.TAGS, data),
  updateTag: (id: string, data: SettingsPayload) => api.put(ENDPOINTS.TAG_BY_ID(id), data),
  deleteTag: (id: string) => api.delete(ENDPOINTS.TAG_BY_ID(id)),

  // Priorities
  getPriorities: () => api.get(ENDPOINTS.PRIORITIES),
  createPriority: (data: SettingsPayload) => api.post(ENDPOINTS.PRIORITIES, data),
  updatePriority: (id: string, data: SettingsPayload) => api.put(ENDPOINTS.PRIORITY_BY_ID(id), data),
  deletePriority: (id: string) => api.delete(ENDPOINTS.PRIORITY_BY_ID(id)),

  // Quick Actions
  getQuickActions: () => api.get(ENDPOINTS.QUICK_ACTIONS),
  createQuickAction: (data: SettingsPayload) => api.post(ENDPOINTS.QUICK_ACTIONS, data),
  updateQuickAction: (id: string, data: SettingsPayload) => api.put(ENDPOINTS.QUICK_ACTION_BY_ID(id), data),
  deleteQuickAction: (id: string) => api.delete(ENDPOINTS.QUICK_ACTION_BY_ID(id)),

  // Relationship Types
  getRelationshipTypes: () => api.get(ENDPOINTS.RELATIONSHIP_TYPES),
  createRelationshipType: (data: SettingsPayload) => api.post(ENDPOINTS.RELATIONSHIP_TYPES, data),
  updateRelationshipType: (id: string, data: SettingsPayload) => api.put(ENDPOINTS.RELATIONSHIP_TYPE_BY_ID(id), data),
  deleteRelationshipType: (id: string) => api.delete(ENDPOINTS.RELATIONSHIP_TYPE_BY_ID(id)),

  // User Settings
  getUserSettings: () => api.get(ENDPOINTS.USER_SETTINGS),
  updateUserSetting: (key: string, value: unknown) => api.post(ENDPOINTS.USER_SETTINGS, { key, value }),

  // Module Settings
  getAllModuleSettings: () => api.get(ENDPOINTS.MODULE_SETTINGS),
  getModuleSettings: (moduleId: string) => api.get(ENDPOINTS.MODULE_SETTINGS_BY_ID(moduleId)),
  saveModuleSetting: (moduleId: string, key: string, value: unknown) => 
    api.post(ENDPOINTS.MODULE_SETTINGS_BY_ID(moduleId), { key, value }),
  updateModuleSettings: (moduleId: string, settings: SettingsPayload) =>
    api.put(ENDPOINTS.MODULE_SETTINGS_BY_ID(moduleId), { settings }),
  deleteModuleSetting: (moduleId: string, key: string) =>
    api.delete(ENDPOINTS.MODULE_SETTINGS_KEY(moduleId, key)),
};
