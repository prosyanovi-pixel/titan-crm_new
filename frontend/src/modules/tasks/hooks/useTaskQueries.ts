import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Task } from "../types";
import { tasksApi } from "../api/tasks.api";

/** Ключи React Query для запросов модуля задач */
export const TASK_KEYS = {
  all: ["tasks"] as const,
  lists: () => [...TASK_KEYS.all, "list"] as const,
  details: () => [...TASK_KEYS.all, "detail"] as const,
  detail: (id: string) => [...TASK_KEYS.details(), id] as const,
  references: ["tasks", "references"] as const,
  users: ["users"] as const,
};

/**
 * Хук для получения списка задач (TanStack Query)
 * @returns Результат запроса TanStack Query со списком задач
 */
export function useTasksList() {
  return useQuery({
    queryKey: TASK_KEYS.lists(),
    queryFn: async () => {
      const response = await api.get("/tasks");
      return response as Task[];
    },
  });
}

/**
 * Обертка над useTasksList для совместимости и упрощенного доступа
 * @returns Объект со списком задач, статусом загрузки и ошибкой
 */
export function useTasks() {
  const { data, isLoading, error, refetch } = useTasksList();
  const tasks = Array.isArray(data) ? data : [];
  return {
    tasks,
    loading: isLoading,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
    refetch,
  };
}

interface ReferenceOption {
  id: string;
  name: string;
}

/**
 * Хук для получения справочных данных модуля задач
 * @returns Объект со справочниками (приоритеты, статусы)
 */
export function useTaskReferences() {
  const query = useQuery({
    queryKey: TASK_KEYS.references,
    queryFn: async () => {
      const response = await api.get("/references");
      return response as { priorities: ReferenceOption[]; taskStatuses: ReferenceOption[] };
    },
    staleTime: 1000 * 60 * 30, // 30 минут
  });

  const data = query.data;
  const references = {
    priorities: Array.isArray(data?.priorities) ? data.priorities : [],
    taskStatuses: Array.isArray(data?.taskStatuses) ? data.taskStatuses : [],
  };

  return {
    ...query,
    data: references,
    references, // для удобства доступа
  };
}

/**
 * Хук для получения списка пользователей для назначения задач
 * @returns Объект со списком пользователей и статусом запроса
 */
export function useTaskUsers() {
  const query = useQuery({
    queryKey: TASK_KEYS.users,
    queryFn: async () => {
      const response = await api.get("/users");
      return response as { id: string; name: string }[];
    },
    staleTime: 1000 * 60 * 5, // 5 минут
  });

  const users = Array.isArray(query.data) ? query.data : [];

  return {
    ...query,
    data: users,
    users, // для удобства доступа
  };
}

/**
 * Хук для выполнения мутаций задач (создание, обновление, удаление)
 * @returns Объект с мутациями
 */
export function useTaskMutations() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const createMutation = useMutation({
    mutationFn: (data: Partial<Task>) => api.post("/tasks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all });
      toast.success(t("tasks.toast.created"));
    },
    onError: () => {
      toast.error(t("tasks.toast.save_error"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => 
      api.put(`/tasks/${id}`, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: TASK_KEYS.lists() });
      const previousTasks = queryClient.getQueryData(TASK_KEYS.lists());

      queryClient.setQueryData(TASK_KEYS.lists(), (old: Task[] | undefined) => {
        if (!old) return [];
        return old.map(task =>
          task.id === id ? { ...task, ...data } : task
        );
      });

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASK_KEYS.lists(), context.previousTasks);
      }
      toast.error(t("tasks.toast.save_error"));
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all });
      if (data?.id) {
        // Отправляем событие об обновлении задачи для других модулей
        window.dispatchEvent(new CustomEvent('task:updated', { detail: { taskId: data.id } }));
      }
    },
    onSuccess: () => {
      toast.success(t("tasks.toast.updated"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all });
      toast.success(t("tasks.toast.deleted"), {
        action: {
          label: t('common.actions.undo'),
          onClick: () => {
            fetch(`/api/trash/tasks/${id}/restore`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'x-user-id': localStorage.getItem('user_id') || ''
              }
            }).then(() => {
              queryClient.invalidateQueries({ queryKey: TASK_KEYS.all });
              toast.success(t('common.messages.restored'));
            }).catch(() => {
              toast.error(t('common.errors.general'));
            });
          }
        }
      });
    },
    onError: () => {
      toast.error(t("tasks.toast.delete_error"));
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => tasksApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_KEYS.all });
      toast.success(t("tasks.toast.bulk_deleted"));
    },
    onError: () => {
      toast.error(t("tasks.toast.delete_error"));
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    bulkDeleteMutation,
  };
}
