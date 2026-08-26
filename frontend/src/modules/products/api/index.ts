import { api } from '@/lib/api';
import { Product, ProductCategory, CreateProductDto, CreateCategoryDto } from '../types';

export const productsApi = {
  // Categories
  getCategories: () => api.get('/products/categories') as Promise<ProductCategory[]>,
  createCategory: (data: CreateCategoryDto) => api.post('/products/categories', data) as Promise<ProductCategory>,
  updateCategory: (id: number, data: Partial<CreateCategoryDto>) => api.put(`/products/categories/${id}`, data) as Promise<ProductCategory>,
  deleteCategory: (id: number) => api.delete(`/products/categories/${id}`),

  // Products
  getProducts: async (params?: any): Promise<{ data: Product[], pagination: any } | Product[]> => {
    const data = await api.get('/products', { params });
    return data;
  },
  createProduct: (data: CreateProductDto) => api.post('/products', data) as Promise<Product>,
  updateProduct: (id: number, data: Partial<CreateProductDto>) => api.put(`/products/${id}`, data) as Promise<Product>,
  deleteProduct: (id: number) => api.delete(`/products/${id}`),
  deleteProductBulk: (ids: number[]) => api.post(`/products/bulk-delete`, { ids }),
  updateProductBulk: (ids: number[], updates: Partial<CreateProductDto>) => api.post(`/products/bulk-update`, { ids, updates }),
};
