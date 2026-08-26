
import { FileItem, FolderStats } from "./types/document.types";

export const initialFiles: FileItem[] = [];

export const storageStats: FolderStats = {
  used: 12.5 * 1024 * 1024 * 1024,
  total: 50 * 1024 * 1024 * 1024,
  percentage: 25,
  filesCount: 1458,
  categories: {
    documents: 8 * 1024 * 1024 * 1024,
    images: 4 * 1024 * 1024 * 1024,
    others: 0.5 * 1024 * 1024 * 1024
  }
};
