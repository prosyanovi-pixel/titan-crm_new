import { FileItem, DocumentFilters } from "./document.types";

export interface GetFilesResponse {
  data: FileItem[];
}

export interface GetFileResponse {
  data: FileItem;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string | null;
}

export interface UploadFileRequest {
  file: File;
  parentId?: string | null;
}

export interface DeleteFileResponse {
  success: boolean;
}
