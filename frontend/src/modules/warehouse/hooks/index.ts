export * from './useWarehousePage';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { warehouseApi, Warehouse } from '../api/warehouseApi';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

export const useCreateWarehouse = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (data: Partial<Warehouse>) => warehouseApi.createWarehouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success(t('warehouse.create_success'));
    },
    onError: (error: Error | any) => {
      toast.error(error?.response?.data?.message || t('warehouse.create_error'));
    },
  });
};

export const useUpdateWarehouse = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Warehouse> }) => warehouseApi.updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success(t('warehouse.update_success'));
    },
    onError: (error: Error | any) => {
      toast.error(error?.response?.data?.message || t('warehouse.update_error'));
    },
  });
};

export const useDeleteWarehouseBulk = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: (ids: number[]) => warehouseApi.deleteWarehouseBulk(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success(t('warehouse.delete_bulk_success'));
    },
    onError: (error: Error | any) => {
      toast.error(error?.response?.data?.message || t('warehouse.delete_bulk_error'));
    },
  });
};

export const useUpdateWarehouseBulk = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ ids, updates }: { ids: number[], updates: Partial<Warehouse> }) => warehouseApi.updateWarehouseBulk(ids, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      toast.success(t('warehouse.update_bulk_success'));
    },
    onError: (error: Error | any) => {
      toast.error(error?.response?.data?.message || t('warehouse.update_bulk_error'));
    },
  });
};
