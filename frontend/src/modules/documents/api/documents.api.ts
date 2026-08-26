import { api } from "@/lib/api";
import { ENDPOINTS } from "./endpoints";
import {
  CreateFolderRequest,
} from "../types/api.types";

export const documentsApi = {
  getAll: (parentId?: string | null) => {
    const url = parentId
      ? `${ENDPOINTS.FILES}?parentId=${parentId}`
      : ENDPOINTS.FILES;
    return api.get(url);
  },
  getById: (id: string) => api.get(ENDPOINTS.FILE_BY_ID(id)),
  createFolder: (data: CreateFolderRequest) => api.post(`${ENDPOINTS.FILES}/folder`, { ...data, type: "folder" }),
  uploadFile: (file: File, parentId?: string | null) => {
    const formData = new FormData();
    formData.append("file", file);
    if (parentId) formData.append("parentId", parentId);
    return api.post(ENDPOINTS.UPLOAD, formData);
  },
  deleteFile: (id: string) => api.post(`${ENDPOINTS.FILES}/delete`, { ids: [id] }),
  bulkMove: (ids: string[], parentId?: string | null) => api.post(ENDPOINTS.BULK_MOVE, { ids, parentId: parentId ?? null }),
  bulkRename: (items: Array<{ id: string; name: string }>) => api.post(ENDPOINTS.BULK_RENAME, { items }),
  toggleStar: (id: string, starred: boolean) => api.patch(`${ENDPOINTS.FILES}/${id}/star`, { starred }),
  getStats: () => api.get(ENDPOINTS.FOLDER_STATS),
};
