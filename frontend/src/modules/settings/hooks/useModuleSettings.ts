/**
 * Hook for managing module-specific settings
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "../api";

const DEFAULT_SETTINGS = {};

export function useModuleSettings(moduleId: string | undefined) {
  const {
    data: settings = DEFAULT_SETTINGS as Record<string, unknown>,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["moduleSettings", moduleId],
    queryFn: () => {
      if (!moduleId) return Promise.resolve({});
      return settingsApi.getModuleSettings(moduleId).then((res) => res.settings);
    },
    enabled: !!moduleId,
  });

  return { settings, isLoading, error };
}

export function useAllModuleSettings() {
  const {
    data: modules = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["allModuleSettings"],
    queryFn: () => settingsApi.getAllModuleSettings(),
  });

  return { modules, isLoading, error };
}

export function useSaveModuleSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      moduleId,
      key,
      value,
    }: {
      moduleId: string;
      key: string;
      value: unknown;
    }) => settingsApi.saveModuleSetting(moduleId, key, value),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        ["moduleSettings", variables.moduleId],
        data.settings
      );
      queryClient.invalidateQueries({
        queryKey: ["allModuleSettings"],
      });
    },
  });
}

export function useUpdateModuleSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      moduleId,
      settings,
    }: {
      moduleId: string;
      settings: Record<string, unknown>;
    }) => settingsApi.updateModuleSettings(moduleId, settings),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        ["moduleSettings", variables.moduleId],
        data.settings
      );
      queryClient.invalidateQueries({
        queryKey: ["allModuleSettings"],
      });
    },
  });
}

export function useDeleteModuleSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      moduleId,
      key,
    }: {
      moduleId: string;
      key: string;
    }) => settingsApi.deleteModuleSetting(moduleId, key),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        ["moduleSettings", variables.moduleId],
        data.settings
      );
      queryClient.invalidateQueries({
        queryKey: ["allModuleSettings"],
      });
    },
  });
}
