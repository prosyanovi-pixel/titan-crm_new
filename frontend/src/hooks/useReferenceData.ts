import { useQuery } from '@tanstack/react-query';
import { settingsService } from '@/modules/settings/api/settingsService';
import { api } from '@/lib/api';

/**
 * Централизованный хук для загрузки справочных данных (словарей).
 * Данные кэшируются на 1 час, чтобы избежать лишних запросов к API.
 * При любых изменениях справочников в настройках необходимо инвалидировать ключ ['referenceData'].
 */
export function useReferenceData() {
  return useQuery({
    queryKey: ['referenceData'],
    queryFn: async () => {
      const [settingsData, references] = await Promise.all([
        settingsService.getReferenceData(),
        api.get('/references')
      ]);
      return {
        ...settingsData,
        modules: references?.modules || []
      };
    },
    staleTime: 1000 * 60 * 60, // 1 час
    gcTime: 1000 * 60 * 60 * 24, // 24 часа
  });
}
