import { Mail, MailFolder, MailFilters } from "../types";
import { api } from "@/lib/api";

export const mailService = {
  // Get all emails
  getAll: async (): Promise<Mail[]> => {
    try {
      const response = await api.get("/mail");
      return response as Mail[];
    } catch (error) {
      console.error("Ошибка при получении писем:", error);
      throw error;
    }
  },

  // Get emails by folder
  getByFolder: async (folder: string): Promise<Mail[]> => {
    try {
      const response = await api.get(`/mail?folder=${folder}`);
      return response as Mail[];
    } catch (error) {
      console.error(`Ошибка при получении писем из папки ${folder}:`, error);
      throw error;
    }
  },

  // Get email by ID
  getById: async (id: string): Promise<Mail> => {
    try {
      const response = await api.get(`/mail/${id}`);
      return response as Mail;
    } catch (error) {
      console.error(`Ошибка при получении письма с ID ${id}:`, error);
      throw error;
    }
  },

  // Send email
  send: async (mail: Partial<Mail>): Promise<Mail> => {
    try {
      const response = await api.post("/mail", mail);
      return response as Mail;
    } catch (error) {
      console.error("Ошибка при отправке письма:", error);
      throw error;
    }
  },

  // Mark as read/unread
  markAsRead: async (id: string, isRead: boolean): Promise<void> => {
    try {
      await api.patch(`/mail/${id}/read`, { isRead });
    } catch (error) {
      console.error("Ошибка при изменении статуса прочтения:", error);
      throw error;
    }
  },

  // Toggle star
  toggleStar: async (id: string, isStarred: boolean): Promise<void> => {
    try {
      await api.patch(`/mail/${id}/star`, { isStarred });
    } catch (error) {
      console.error("Ошибка при изменении избранного:", error);
      throw error;
    }
  },

  // Move to folder
  moveToFolder: async (id: string, folder: string): Promise<void> => {
    try {
      await api.patch(`/mail/${id}/move`, { folder });
    } catch (error) {
      console.error("Ошибка при перемещении письма:", error);
      throw error;
    }
  },

  // Delete email
  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/mail/${id}`);
    } catch (error) {
      console.error(`Ошибка при удалении письма с ID ${id}:`, error);
      throw error;
    }
  },

  // Get folders
  getFolders: async (): Promise<MailFolder[]> => {
    try {
      const response = await api.get("/mail/folders");
      return response as MailFolder[];
    } catch (error) {
      console.error("Ошибка при получении папок:", error);
      throw error;
    }
  },

  // Get filtered emails
  getFiltered: async (filters: MailFilters): Promise<Mail[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append("search", filters.search);
      if (filters.folder) queryParams.append("folder", filters.folder);
      if (filters.labels?.length) {
        filters.labels.forEach(label => queryParams.append("labels", label));
      }
      if (filters.dateRange) {
        queryParams.append("from", filters.dateRange.from.toISOString());
        queryParams.append("to", filters.dateRange.to.toISOString());
      }

      const response = await api.get(`/mail?${queryParams.toString()}`);
      return response as Mail[];
    } catch (error) {
      console.error("Ошибка при получении отфильтрованных писем:", error);
      throw error;
    }
  },
};
