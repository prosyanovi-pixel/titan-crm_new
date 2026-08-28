import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PriceList, PriceListItem } from '../types';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/lib/i18n';

export const usePriceLists = () => {
  return useQuery({
    queryKey: ['price_lists'],
    queryFn: async () => {
      const data = await api.get('/price-lists');
      return data as PriceList[];
    },
  });
};

export const useCreatePriceList = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (priceList: Partial<PriceList>) => {
      const data = await api.post('/price-lists', priceList);
      return data as PriceList;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price_lists'] });
      toast({ title: t('common.success'), description: t('common.saved_successfully') });
    },
  });
};

export const useUpdatePriceList = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<PriceList> }) => {
      const response = await api.put(`/price-lists/${id}`, data);
      return response as PriceList;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price_lists'] });
      toast({ title: t('common.success'), description: t('common.saved_successfully') });
    },
  });
};

export const useDeletePriceList = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/price-lists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price_lists'] });
      toast({ title: t('common.success'), description: t('common.deleted_successfully') });
    },
  });
};

export const usePriceListItems = (priceListId: number, itemType?: 'product' | 'service') => {
  return useQuery({
    queryKey: ['price_list_items', priceListId, itemType],
    queryFn: async () => {
      const data = await api.get(`/price-lists/${priceListId}/items`, {
        params: { itemType },
      });
      return data as PriceListItem[];
    },
    enabled: !!priceListId,
  });
};

export const useSetPriceListItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ priceListId, data }: { priceListId: number; data: Partial<PriceListItem> }) => {
      const response = await api.post(`/price-lists/${priceListId}/items`, data);
      return response as PriceListItem;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['price_list_items', variables.priceListId] });
    },
  });
};
