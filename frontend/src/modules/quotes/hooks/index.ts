import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Quote } from '../types';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/lib/i18n';

export const useQuotes = () => {
  return useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      const data = await api.get('/quotes');
      return data as Quote[];
    },
  });
};

export const useQuote = (id: number | null) => {
  return useQuery({
    queryKey: ['quotes', id],
    queryFn: async () => {
      const data = await api.get(`/quotes/${id}`);
      return data as Quote;
    },
    enabled: !!id,
  });
};

export const useCreateQuote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (quote: Partial<Quote>) => {
      const data = await api.post('/quotes', quote);
      return data as Quote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({ title: t('common.success'), description: t('common.saved_successfully') });
    },
  });
};

export const useUpdateQuote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Quote> }) => {
      const response = await api.put(`/quotes/${id}`, data);
      return response as Quote;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes', variables.id] });
      toast({ title: t('common.success'), description: t('common.saved_successfully') });
    },
  });
};

export const useDeleteQuote = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/quotes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast({ title: t('common.success'), description: t('common.deleted_successfully') });
    },
  });
};
