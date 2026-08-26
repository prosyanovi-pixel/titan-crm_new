import { ProfileData, ShareLink } from "../types";
import { FileItem } from "@/modules/documents/types";
import { api } from "@/lib/api";

export const profileService = {
  // Get current user profile
  getCurrentProfile: async (): Promise<ProfileData> => {
    try {
      const response = await api.get("/profile");
      return response as ProfileData;
    } catch (error) {
      console.error("Ошибка при получении профиля:", error);
      throw error;
    }
  },

  // Get profile by ID
  getById: async (id: string): Promise<ProfileData> => {
    try {
      const response = await api.get(`/profile/${id}`);
      return response as ProfileData;
    } catch (error) {
      console.error(`Ошибка при получении профиля с ID ${id}:`, error);
      throw error;
    }
  },

  // Update profile
  update: async (id: string, data: Partial<ProfileData>): Promise<ProfileData> => {
    try {
      const response = await api.put(`/profile/${id}`, data);
      return response as ProfileData;
    } catch (error) {
      console.error("Ошибка при обновлении профиля:", error);
      throw error;
    }
  },

  // Update avatar
  updateAvatar: async (id: string, file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const response = await api.post(`/profile/${id}/avatar`, formData);
      return (response as { avatarUrl: string }).avatarUrl;
    } catch (error) {
      console.error("Ошибка при обновлении аватара:", error);
      throw error;
    }
  },

  // Get user documents
  getDocuments: async (userId: string): Promise<FileItem[]> => {
    try {
      const response = await api.get(`/profile/${userId}/documents`);
      return response as FileItem[];
    } catch (error) {
      console.error("Ошибка при получении документов пользователя:", error);
      throw error;
    }
  },

  // Create share link
  createShareLink: async (documentId: string, expiresAt?: Date): Promise<ShareLink> => {
    try {
      const response = await api.post("/profile/share-links", {
        documentId,
        expiresAt: expiresAt?.toISOString(),
      });
      return response as ShareLink;
    } catch (error) {
      console.error("Ошибка при создании ссылки для доступа:", error);
      throw error;
    }
  },

  // Delete share link
  deleteShareLink: async (linkId: string): Promise<void> => {
    try {
      await api.delete(`/profile/share-links/${linkId}`);
    } catch (error) {
      console.error("Ошибка при удалении ссылки для доступа:", error);
      throw error;
    }
  },

  // Change password
  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    try {
      await api.post("/profile/change-password", { oldPassword, newPassword });
    } catch (error) {
      console.error("Ошибка при изменении пароля:", error);
      throw error;
    }
  },
};
