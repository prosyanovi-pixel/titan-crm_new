import { api } from '@/lib/api';
import { Template, CreateTemplatePayload, TemplateVariable, CreateVariablePayload, Numerator } from '../types';

export const templatesApi = {
  getTemplates: async (params?: { moduleId?: string }): Promise<Template[]> => {
    return await api.get('/templates', { params });
  },

  getTemplate: async (id: number): Promise<Template> => {
    return await api.get(`/templates/${id}`);
  },

  createTemplate: async (payload: CreateTemplatePayload | FormData): Promise<Template> => {
    return await api.post('/templates', payload);
  },

  updateTemplate: async (id: number, payload: Partial<Template> | FormData): Promise<Template> => {
    return await api.put(`/templates/${id}`, payload);
  },

  deleteTemplate: async (id: number): Promise<void> => {
    await api.delete(`/templates/${id}`);
  },

  copyTemplate: async (id: number): Promise<Template> => {
    return await api.post(`/templates/${id}/copy`);
  },

  downloadTemplate: async (id: number): Promise<Blob> => {
    return await api.get(`/templates/${id}/download`, { responseType: 'blob' });
  },

  generateDocument: async (id: number, entityId: string | number, autoAttach = true): Promise<Blob> => {
    return await api.post(`/templates/${id}/generate?attach=${autoAttach}`, { entityId }, { responseType: 'blob' });
  },

  generateDocumentAction: async (id: number, entityId: string | number, folderId?: string): Promise<{ success: boolean; documentId: string; storedFilename: string; targetAction: string }> => {
    return await api.post(`/templates/${id}/generate-action`, { entityId, folderId });
  },

  generateDocumentBulk: async (templateId: number, entityIds: (number | string)[]): Promise<Blob> => {
    return await api.post(`/templates/${templateId}/generate-bulk`, { entityIds }, {
      responseType: 'blob'
    });
  },

  generateDocumentBulkAsync: async (templateId: number, entityIds: (number | string)[]): Promise<{ success: boolean; message: string }> => {
    return await api.post(`/templates/${templateId}/generate-bulk-async`, { entityIds });
  },

  getModuleFields: async (moduleId: string): Promise<Array<{key: string; name?: string; description?: string}>> => {
    return await api.get(`/templates/fields/${moduleId}`);
  },

  getVariables: async (moduleId?: string): Promise<TemplateVariable[]> => {
    return await api.get('/templates/variables', { params: { moduleId } });
  },

  createVariable: async (payload: CreateVariablePayload): Promise<TemplateVariable> => {
    return await api.post('/templates/variables', payload);
  },

  updateVariable: async (id: string, payload: Partial<TemplateVariable>): Promise<TemplateVariable> => {
    return await api.put(`/templates/variables/${id}`, payload);
  },

  deleteVariable: async (id: string): Promise<void> => {
    await api.delete(`/templates/variables/${id}`);
  },

  getNumerators: async (): Promise<Numerator[]> => {
    return await api.get('/templates/numerators');
  },

  createNumerator: async (payload: { name: string; mask: string }): Promise<Numerator> => {
    return await api.post('/templates/numerators', payload);
  },

  updateNumerator: async (id: number, payload: { name: string; mask: string }): Promise<Numerator> => {
    return await api.put(`/templates/numerators/${id}`, payload);
  },

  deleteNumerator: async (id: number): Promise<void> => {
    await api.delete(`/templates/numerators/${id}`);
  }
};
