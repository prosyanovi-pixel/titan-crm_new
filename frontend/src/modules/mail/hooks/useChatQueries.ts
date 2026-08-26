import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatsApi, ChatsResponse, ChatMessage } from "../api/chats.api";

export const CHAT_KEYS = {
  all: ["chats"] as const,
  list: (params: any) => [...CHAT_KEYS.all, "list", params] as const,
  messages: (chatId: number) => [...CHAT_KEYS.all, "messages", chatId] as const,
};

export function useChats(params?: { page?: number; limit?: number; search?: string; platform?: string }) {
  return useQuery<ChatsResponse>({
    queryKey: CHAT_KEYS.list(params),
    queryFn: async () => {
      const response = await chatsApi.getChats(params);
      return response as ChatsResponse;
    },
  });
}

export function useChatMessages(chatId: number | null) {
  return useQuery<{ data: ChatMessage[] }>({
    queryKey: CHAT_KEYS.messages(chatId!),
    queryFn: async () => {
      if (!chatId) return { data: [] };
      const response = await chatsApi.getChatMessages(chatId);
      return response as { data: ChatMessage[] };
    },
    enabled: !!chatId,
  });
}

export function useChatMutations() {
  const queryClient = useQueryClient();

  const sendMessage = useMutation({
    mutationFn: ({ chatId, text, attachments }: { chatId: number; text: string; attachments?: any[] }) => chatsApi.sendMessage(chatId, text, attachments),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.messages(variables.chatId) });
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.list({}) });
    },
  });

  const editMessage = useMutation({
    mutationFn: ({ chatId, messageId, text }: { chatId: number; messageId: number; text: string }) => chatsApi.editMessage(chatId, messageId, text),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.messages(variables.chatId) });
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.list({}) });
    },
  });

  const clearHistory = useMutation({
    mutationFn: (chatId: number) => chatsApi.clearHistory(chatId),
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.messages(chatId) });
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.list({}) });
    },
  });

  const deleteChat = useMutation({
    mutationFn: (chatId: number) => chatsApi.deleteChat(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.list({}) });
    },
  });

  const uploadFile = useMutation({
    mutationFn: (file: File) => chatsApi.uploadFile(file),
  });

  const markAsRead = useMutation({
    mutationFn: (chatId: number) => chatsApi.markAsRead(chatId),
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.list({}) });
    },
  });

  const createChat = useMutation({
    mutationFn: (data: { name: string; platform?: string }) => chatsApi.createChat(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_KEYS.list({}) });
    }
  });

  return {
    sendMessage,
    editMessage,
    clearHistory,
    deleteChat,
    uploadFile,
    markAsRead,
    createChat,
  };
}
