import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templatesApi } from '../api';
import { CreateTemplatePayload, Template } from '../types';

export const TEMPLATE_KEYS = {
  all: ['templates'] as const,
  variables: (moduleId: string) => [...TEMPLATE_KEYS.all, 'variables', moduleId] as const,
};

export const useTemplates = () => {
  return useQuery<Template[]>({
    queryKey: TEMPLATE_KEYS.all,
    queryFn: () => templatesApi.getTemplates(),
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CreateTemplatePayload | FormData) => templatesApi.createTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.all });
    },
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => templatesApi.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.all });
    },
  });
};

export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Template> | FormData }) => templatesApi.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.all });
    },
  });
};

export const useCopyTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => templatesApi.copyTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TEMPLATE_KEYS.all });
    },
  });
};
