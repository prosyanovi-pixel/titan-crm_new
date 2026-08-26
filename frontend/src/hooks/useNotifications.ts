import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWebSocket } from './useWebSocket';

export interface Notification {
  id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const userId = localStorage.getItem('titan_user_id') || '2';

  const { data: notifications = [], isLoading: loading, refetch: fetchNotifications } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      const data = await api.get('/notifications');
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 60000,
  });

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/notifications/${id}/read`, {}),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', userId] });
      const previous = queryClient.getQueryData<Notification[]>(['notifications', userId]);
      if (previous) {
        queryClient.setQueryData<Notification[]>(
          ['notifications', userId],
          previous.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
      }
      return { previous };
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications', userId], context.previous);
      }
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all', {}),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications', userId] });
      const previous = queryClient.getQueryData<Notification[]>(['notifications', userId]);
      if (previous) {
        queryClient.setQueryData<Notification[]>(
          ['notifications', userId],
          previous.map(n => ({ ...n, isRead: true }))
        );
      }
      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications', userId], context.previous);
      }
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/notifications/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', userId] });
      const previous = queryClient.getQueryData<Notification[]>(['notifications', userId]);
      if (previous) {
        queryClient.setQueryData<Notification[]>(
          ['notifications', userId],
          previous.filter(n => n.id !== id)
        );
      }
      return { previous };
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications', userId], context.previous);
      }
    },
  });

  const markAsRead = async (id: number) => markAsReadMutation.mutateAsync(id);
  const markAllAsRead = async () => markAllAsReadMutation.mutateAsync();
  const deleteNotification = async (id: number) => deleteNotificationMutation.mutateAsync(id);

  // WebSocket integration
  const { lastMessage } = useWebSocket({ userId });

  useEffect(() => {
    // Listen for new notifications via WebSocket
    if (lastMessage?.type === 'notification') {
        fetchNotifications();
    }
  }, [lastMessage, fetchNotifications]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications
  };
}
