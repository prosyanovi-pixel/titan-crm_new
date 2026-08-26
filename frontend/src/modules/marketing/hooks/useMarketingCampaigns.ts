import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketingApi } from '../api';
import { MarketingCampaign } from '../types';

export interface UseMarketingCampaignsParams {
  search?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number | string;
}

export function useMarketingCampaigns(params: UseMarketingCampaignsParams = {}) {
  const queryClient = useQueryClient();
  const limitVal = params.limit === "all" ? 1000 : Number(params.limit) || 20;

  // Filter out 'all' strings from API payload
  const apiParams: any = {
    page: params.page || 1,
    limit: limitVal,
  };
  
  if (params.search?.trim()) apiParams.search = params.search.trim();
  if (params.status && params.status !== "all") apiParams.status = params.status;
  if (params.type && params.type !== "all") apiParams.type = params.type;

  const queryKey = ['marketingCampaigns', apiParams];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await marketingApi.getAll(apiParams);
      if (res && res.data) {
        return {
          data: res.data as MarketingCampaign[],
          total: res.total || res.data.length
        };
      } else {
        const dataArray = Array.isArray(res) ? res : [];
        return {
          data: dataArray as MarketingCampaign[],
          total: dataArray.length
        };
      }
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['marketingCampaigns'] });

  const createMutation = useMutation({
    mutationFn: (campaign: Partial<MarketingCampaign>) => marketingApi.create(campaign),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<MarketingCampaign> }) => marketingApi.update(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => marketingApi.delete(id),
    onSuccess: invalidate,
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => marketingApi.bulkDelete(ids),
    onSuccess: invalidate,
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, field, value }: { ids: string[], field: string, value: any }) => marketingApi.bulkUpdate(ids, field, value),
    onSuccess: invalidate,
  });

  return {
    ...query,
    campaigns: query.data?.data || [],
    totalCount: query.data?.total || 0,
    createCampaign: createMutation.mutateAsync,
    updateCampaign: updateMutation.mutateAsync,
    deleteCampaign: deleteMutation.mutateAsync,
    bulkDeleteCampaigns: bulkDeleteMutation.mutateAsync,
    bulkUpdateCampaigns: bulkUpdateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,
    isBulkUpdating: bulkUpdateMutation.isPending,
  };
}
