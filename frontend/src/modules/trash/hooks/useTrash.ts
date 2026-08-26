import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trashApi, TrashItem } from '../api/trash.api';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';

export function useTrash() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: trashItems = [], isLoading } = useQuery({
    queryKey: ['trash'],
    queryFn: () => trashApi.getAll()
  });

  const restoreMutation = useMutation({
    mutationFn: ({ module, id }: { module: string, id: string | number }) => trashApi.restore(module, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      // Invalidate relevant module lists too if possible, but they will be fresh on navigation
      toast.success(t('common.messages.restored'));
    },
    onError: () => {
      toast.error(t('common.errors.restore'));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: ({ module, id }: { module: string, id: string | number }) => trashApi.delete(module, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      toast.success(t('common.messages.deleted'));
    },
    onError: () => {
      toast.error(t('common.errors.delete'));
    }
  });

  const emptyMutation = useMutation({
    mutationFn: () => trashApi.empty(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash'] });
      toast.success(t('common.messages.empty_trash_success'));
    },
    onError: () => {
      toast.error(t('common.errors.general'));
    }
  });

  return {
    trashItems,
    isLoading,
    restoreItem: restoreMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    emptyTrash: emptyMutation.mutateAsync,
    isRestoring: restoreMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isEmptying: emptyMutation.isPending,
  };
}
