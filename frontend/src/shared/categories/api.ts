/**
 * Shared Category API Service
 * Provides a unified interface for category operations across modules
 */

import { api } from '@/lib/api';
import { CategoryNode, BaseCategory, CreateCategoryDto, CategoryListResponse } from './types';

// Module-specific endpoints configuration
const CATEGORY_ENDPOINTS = {
  products: '/products/categories',
  services: '/services/categories',
  warehouse: '/warehouse/categories',
} as const;

type CategoryModule = keyof typeof CATEGORY_ENDPOINTS;

/**
 * Generic category API client for any module
 */
export class CategoryApiService {
  private readonly module: CategoryModule;
  private readonly basePath: string;

  constructor(module: CategoryModule) {
    this.module = module;
    this.basePath = CATEGORY_ENDPOINTS[module];
  }

  /**
   * Get all categories as a flat list
   */
  async getCategories(params?: Record<string, any>): Promise<BaseCategory[]> {
    const response = await api.get(this.basePath, { params });
    return response.data || response;
  }

  /**
   * Get categories as a nested tree structure
   */
  async getCategoriesTree(): Promise<CategoryNode[]> {
    const response = await api.get(`${this.basePath}/tree`);
    return response.data || response;
  }

  /**
   * Get a single category by ID
   */
  async getCategoryById(id: number): Promise<BaseCategory> {
    const response = await api.get(`${this.basePath}/${id}`);
    return response.data || response;
  }

  /**
   * Create a new category
   */
  async createCategory(data: CreateCategoryDto): Promise<BaseCategory> {
    const response = await api.post(this.basePath, data);
    return response.data || response;
  }

  /**
   * Update an existing category
   */
  async updateCategory(id: number, data: Partial<CreateCategoryDto>): Promise<BaseCategory> {
    const response = await api.put(`${this.basePath}/${id}`, data);
    return response.data || response;
  }

  /**
   * Delete a category by ID
   */
  async deleteCategory(id: number): Promise<void> {
    await api.delete(`${this.basePath}/${id}`);
  }

  /**
   * Delete multiple categories
   */
  async deleteCategoriesBulk(ids: number[]): Promise<void> {
    await api.post(`${this.basePath}/bulk-delete`, { ids });
  }

  /**
   * Move a category to a new parent
   */
  async moveCategory(categoryId: number, newParentId: number | null): Promise<BaseCategory> {
    const response = await api.patch(`${this.basePath}/${categoryId}/move`, { parentId: newParentId });
    return response.data || response;
  }

  /**
   * Search categories by name
   */
  async searchCategories(query: string): Promise<BaseCategory[]> {
    const response = await api.get(`${this.basePath}/search`, { params: { q: query } });
    return response.data || response;
  }

  /**
   * Get descendants of a specific category
   */
  async getCategoryDescendants(categoryId: number): Promise<BaseCategory[]> {
    const response = await api.get(`${this.basePath}/${categoryId}/descendants`);
    return response.data || response;
  }
}

// Pre-configured instances for each module
export const productsCategoriesApi = new CategoryApiService('products');
export const servicesCategoriesApi = new CategoryApiService('services');
export const warehouseCategoriesApi = new CategoryApiService('warehouse');

/**
 * Factory function to get category API for any module
 */
export function getCategoryApi(module: CategoryModule): CategoryApiService {
  return new CategoryApiService(module);
}

/**
 * Get all categories across all modules (for admin purposes)
 */
export async function getAllCategories(): Promise<{
  products: BaseCategory[];
  services: BaseCategory[];
  warehouse: BaseCategory[];
}> {
  const [products, services, warehouse] = await Promise.all([
    productsCategoriesApi.getCategories(),
    servicesCategoriesApi.getCategories(),
    warehouseCategoriesApi.getCategories(),
  ]);

  return { products, services, warehouse };
}
