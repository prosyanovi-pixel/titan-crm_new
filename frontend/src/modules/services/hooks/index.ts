import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Service, ServiceCategory } from '../types';
import { toast } from 'sonner';

export const useServiceCategoriesTree = () => {
  return useQuery({
    queryKey: ['service_categories_tree'],
    queryFn: async (): Promise<ServiceCategory[]> => {
      return await api.get('/services/categories/tree');
    },
  });
};

export const useSaveServiceCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: Partial<ServiceCategory>) => {
      if (category.id) {
        return await api.put(`/services/categories/${category.id}`, category);
      } else {
        return await api.post('/services/categories', category);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_categories_tree'] });
      toast.success('Раздел успешно сохранен');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Ошибка при сохранении раздела');
    }
  });
};

export const useDeleteServiceCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/services/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service_categories_tree'] });
      toast.success('Раздел удален');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Ошибка при удалении раздела');
    }
  });
};

export const useServices = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['services', params],
    queryFn: async (): Promise<{ data: Service[], pagination: unknown } | Service[]> => {
      // Pass params to api.get
      return await api.get('/services', { params });
    },
  });
};

export const useSaveService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (service: Partial<Service>) => {
      const payload = {
        name: service.name,
        description: service.description,
        images: service.images,
        translations: service.translations,
        categoryId: service.categoryId,
        type: service.type,
        baseCost: service.baseCost,
        costType: service.costType,
        taxContributionsRate: service.taxContributionsRate,
        vatRate: service.vatRate,
        isActive: service.isActive,
        status: service.status,
        tags: service.tags
      };

      if (service.id) {
        const { data } = await api.put(`/services/${service.id}`, payload);
        return data;
      } else {
        const { data } = await api.post('/services', payload);
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Услуга успешно сохранена');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Ошибка при сохранении услуги');
    }
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Услуга удалена');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Ошибка при удалении услуги');
    }
  });
};

export const useDeleteServiceBulk = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) => {
      await api.post(`/services/bulk-delete`, { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Услуги удалены');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Ошибка при массовом удалении услуг');
    }
  });
};

export * from './useServicesPage';

export const useUpdateServiceBulk = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: number[], updates: Partial<Service> }) => {
      await api.post(`/services/bulk-update`, { ids, updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Услуги обновлены');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message || 'Ошибка при массовом обновлении услуг');
    }
  });
};
