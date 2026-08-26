import { api } from "@/lib/api";
import { FileItem, FolderStats, DocumentFilters } from "../types/document.types";
import {
  CreateFolderRequest,
  UploadFileRequest,
} from "../types/api.types";
import { ENDPOINTS } from "./endpoints";

export class DocumentService {
  async getAll(parentId?: string | null): Promise<FileItem[]> {
    const url = parentId
      ? `${ENDPOINTS.FILES}?parentId=${parentId}`
      : ENDPOINTS.FILES;
    const response = await api.get(url);
    return response || [];
  }

  async getById(id: string): Promise<FileItem | null> {
    const response = await api.get(ENDPOINTS.FILE_BY_ID(id));
    return response || null;
  }

  async createFolder(data: CreateFolderRequest): Promise<FileItem> {
    const response = await api.post(`${ENDPOINTS.FILES}/folder`, { ...data, type: "folder" });
    return response;
  }

  async uploadFile(data: UploadFileRequest): Promise<FileItem> {
    const formData = new FormData();
    formData.append("file", data.file);
    if (data.parentId) {
      formData.append("parentId", data.parentId);
    }
    const response = await api.post(ENDPOINTS.UPLOAD, formData);
    return response;
  }

  async deleteFile(id: string): Promise<void> {
    await api.post(`${ENDPOINTS.FILES}/delete`, { ids: [id] });
  }

  async bulkMove(ids: string[], parentId?: string | null): Promise<void> {
    await api.post(ENDPOINTS.BULK_MOVE, { ids, parentId: parentId ?? null });
  }

  async bulkRename(items: Array<{ id: string; name: string }>): Promise<FileItem[]> {
    const response = await api.post(ENDPOINTS.BULK_RENAME, { items });
    return response || [];
  }

  async toggleStar(id: string, starred: boolean): Promise<FileItem> {
    const response = await api.patch(`${ENDPOINTS.FILES}/${id}/star`, { starred });
    return response;
  }

  async getStats(): Promise<FolderStats> {
    const response = await api.get(ENDPOINTS.FOLDER_STATS);
    return response || {
      used: "0 GB",
      total: "10 GB",
      percentage: 0,
      filesCount: 0,
    };
  }
}

export const documentService = new DocumentService();
