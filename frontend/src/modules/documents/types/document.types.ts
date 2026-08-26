export type FileType = "folder" | "image" | "pdf" | "doc" | "xls" | "archive";

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  size?: string;
  date: string;
  starred?: boolean;
  isTemplate?: boolean;
  parentId?: string | null;
  deletedAt?: string | null;
  isMissing?: boolean;
}

export interface FolderStats {
  used: number;
  total: number;
  percentage: number;
  filesCount: number;
  categories: {
    documents: number;
    images: number;
    others: number;
  };
}

export interface DocumentFilters {
  type?: FileType;
  searchQuery?: string;
  starred?: boolean;
}
