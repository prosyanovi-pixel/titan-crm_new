/**
 * Shared API Service
 * Provides a unified interface for cross-module API operations
 */

import { api } from '@/lib/api';

/**
 * Base configuration for module endpoints
 */
const MODULE_ENDPOINTS = {
  products: '/products',
  services: '/services',
  warehouse: '/warehouse',
  finance: '/finance',
} as const;

type ModuleName = keyof typeof MODULE_ENDPOINTS;

/**
 * Generic API client for any module
 * Provides consistent interface for CRUD operations
 */
export class ModuleApiService<T> {
  private readonly module: ModuleName;
  private readonly basePath: string;

  constructor(module: ModuleName) {
    this.module = module;
    this.basePath = MODULE_ENDPOINTS[module];
  }

  /**
   * Get all items
   */
  async getAll(params?: Record<string, any>): Promise<T[]> {
    const response = await api.get(this.basePath, { params });
    return response.data?.data || response.data || response;
  }

  /**
   * Get paginated items
   */
  async getPaginated(params?: Record<string, any>): Promise<{ data: T[]; pagination: any }> {
    const response = await api.get(this.basePath, { params });
    return response.data || response;
  }

  /**
   * Get a single item by ID
   */
  async getById(id: number): Promise<T> {
    const response = await api.get(`${this.basePath}/${id}`);
    return response.data || response;
  }

  /**
   * Create a new item
   */
  async create(data: Partial<T>): Promise<T> {
    const response = await api.post(this.basePath, data);
    return response.data || response;
  }

  /**
   * Update an existing item
   */
  async update(id: number, data: Partial<T>): Promise<T> {
    const response = await api.put(`${this.basePath}/${id}`, data);
    return response.data || response;
  }

  /**
   * Delete an item by ID
   */
  async delete(id: number): Promise<void> {
    await api.delete(`${this.basePath}/${id}`);
  }

  /**
   * Bulk delete multiple items
   */
  async deleteBulk(ids: number[]): Promise<void> {
    await api.post(`${this.basePath}/bulk-delete`, { ids });
  }

  /**
   * Search items
   */
  async search(query: string, params?: Record<string, any>): Promise<T[]> {
    const response = await api.get(`${this.basePath}/search`, { 
      params: { q: query, ...params } 
    });
    return response.data?.data || response.data || response;
  }

  /**
   * Get categories for this module
   */
  async getCategories(): Promise<any[]> {
    const response = await api.get(`${this.basePath}/categories`);
    return response.data || response;
  }

  /**
   * Get categories tree for this module
   */
  async getCategoriesTree(): Promise<any[]> {
    const response = await api.get(`${this.basePath}/categories/tree`);
    return response.data || response;
  }

  /**
   * Execute a custom query on the module
   */
  async customRequest(path: string, method: 'get' | 'post' | 'put' | 'delete' | 'patch' = 'get', data?: any): Promise<any> {
    const fullPath = `${this.basePath}${path}`;
    const response = await api[method](fullPath, data);
    return response.data || response;
  }
}

// Pre-configured instances for each module
export const productsApi = new ModuleApiService('products');
export const servicesApi = new ModuleApiService('services');
export const warehouseApi = new ModuleApiService('warehouse');
export const financeApi = new ModuleApiService('finance');

/**
 * Factory function to get API for any module
 */
export function getModuleApi<T>(module: ModuleName): ModuleApiService<T> {
  return new ModuleApiService<T>(module);
}

/**
 * Cross-module operations
 */
export const crossModuleApi = {
  /**
   * Get counts from multiple modules
   */
  async getModuleCounts(): Promise<Record<ModuleName, number>> {
    const modules: ModuleName[] = ['products', 'services', 'warehouse', 'finance'];
    const counts: Record<ModuleName, number> = {} as Record<ModuleName, number>;

    await Promise.all(modules.map(async (module) => {
      try {
        const apiService = getModuleApi(module);
        const result = await apiService.getAll({ limit: 1 });
        // This is a simplified approach, in production you might want a dedicated endpoint
        counts[module] = Array.isArray(result) ? result.length : 0;
      } catch {
        counts[module] = 0;
      }
    }));

    return counts;
  },

  /**
   * Search across multiple modules
   */
  async searchAcrossModules(query: string, modules?: ModuleName[]): Promise<Record<ModuleName, any[]>> {
    const targetModules = modules || ['products', 'services', 'warehouse'];
    const results: Record<ModuleName, any[]> = {} as Record<ModuleName, any[]>;

    await Promise.all(targetModules.map(async (module) => {
      try {
        const apiService = getModuleApi(module);
        results[module] = await apiService.search(query, { limit: 10 });
      } catch {
        results[module] = [];
      }
    }));

    return results;
  },
};

// Re-export category API
export * from '../categories/api';
