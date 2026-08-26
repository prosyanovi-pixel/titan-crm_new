import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api';
import { CreateProductDto, CreateCategoryDto } from '../types';

export const useProducts = (params?: any) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productsApi.getProducts(params),
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductDto) => productsApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateProductDto> }) => productsApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: number) => productsApi.deleteProduct(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('common.messages.deleted'), {
        action: {
          label: t('common.actions.undo'),
          onClick: () => {
            fetch(`/api/trash/products/${id}/restore`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'x-user-id': localStorage.getItem('user_id') || ''
              }
            }).then(() => {
              queryClient.invalidateQueries({ queryKey: ['products'] });
              toast.success(t('common.messages.restored'));
            });
          }
        }
      });
    },
  });
};

export const useDeleteProductBulk = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => productsApi.deleteProductBulk(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProductBulk = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, updates }: { ids: number[], updates: Partial<CreateProductDto> }) => productsApi.updateProductBulk(ids, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useProductCategories = () => {
  return useQuery({
    queryKey: ['productCategories'],
    queryFn: productsApi.getCategories,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryDto) => productsApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCategories'] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateCategoryDto> }) => productsApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCategories'] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productsApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productCategories'] });
    },
  });
};

export * from './useProductsPage';
