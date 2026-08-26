import { api } from "@/lib/api";

export interface Chat {
  id: number;
  platform: 'telegram' | 'whatsapp' | 'email' | 'internal';
  externalChatId?: string;
  name: string;
  avatarUrl?: string;
  userAvatarFallback?: string | null;
  unreadCount: number;
  contractorId?: number;
  lastMessage?: string;
  lastMessageTime?: string;
  isOnline?: boolean;
  lastActiveAt?: string;
  settings?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: number;
  chatId: number;
  externalMessageId?: string;
  senderType: 'user' | 'contractor' | 'system' | 'bot';
  senderId?: number;
  senderFirstName?: string;
  senderLastName?: string;
  senderAvatarUrl?: string;
  text: string;
  isRead: boolean;
  isEdited?: boolean;
  attachments?: Array<{ name: string; url: string; size?: number }>;
  createdAt: string;
}

export interface ChatsResponse {
  data: Chat[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const chatsApi = {
  getChats: (params?: { search?: string; platform?: string; page?: number; limit?: number }) => 
    api.get('/chats', { params }),
    
  createChat: (data: { name: string; platform?: string }) =>
    api.post('/chats', data),

  getChatMessages: (chatId: number, params?: { page?: number; limit?: number }) => 
    api.get(`/chats/${chatId}/messages`, { params }),

  sendMessage: (chatId: number, text: string, attachments?: Array<{ name: string; url: string; size?: number }>) => 
    api.post(`/chats/${chatId}/messages`, { text, attachments }),

  editMessage: (chatId: number, messageId: number, text: string) =>
    api.put(`/chats/${chatId}/messages/${messageId}`, { text }),

  clearHistory: (chatId: number) =>
    api.delete(`/chats/${chatId}/messages`),

  deleteChat: (chatId: number) =>
    api.delete(`/chats/${chatId}`),

  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/chats/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  markAsRead: (chatId: number) => 
    api.put(`/chats/${chatId}/read`),
};
