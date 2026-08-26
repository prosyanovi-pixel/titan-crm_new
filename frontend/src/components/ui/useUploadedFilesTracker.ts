import React, { useRef, useCallback, useState } from 'react';
import { api } from '@/lib/api';

export interface UploadedFile {
  id: string;
  name: string;
  url?: string;
  uploadedAt: Date;
}

export interface UseUploadedFilesTrackerOptions {
  /** API endpoint для очистки (например, '/legal-cases/documents/cleanup') */
  cleanupEndpoint: string;
  
  /** Поле имени для fileIds в запросе (по умолчанию 'fileIds') */
  fileIdsField?: string;
  
  /** Автоматически очищать файлы при размонтировании */
  cleanupOnUnmount?: boolean;
  
  /** Callback после успешной очистки */
  onCleanup?: (deletedIds: string[]) => void;
  
  /** Callback при ошибке очистки */
  onError?: (error: Error, fileIds: string[]) => void;
}

export interface UseUploadedFilesTrackerReturn {
  /** Список отслеживаемых файлов */
  uploadedFiles: UploadedFile[];
  
  /** Добавить файл в список отслеживаемых */
  trackFile: (fileId: string, fileName?: string, url?: string) => void;
  
  /** Добавить несколько файлов */
  trackFiles: (files: Array<{ id: string; name?: string; url?: string }>) => void;
  
  /** Удалить файл из списка отслеживаемых (например, после успешного сохранения) */
  untrackFile: (fileId: string) => void;
  
  /** Очистить все отслеживаемые файлы */
  cleanup: () => Promise<void>;
  
  /** Очистить список без удаления файлов */
  clear: () => void;
  
  /** Количество отслеживаемых файлов */
  count: number;
  
  /** Флаг, идет ли сейчас очистка */
  isCleaning: boolean;
}

/**
 * Хук для отслеживания загруженных файлов и их очистки при отмене
 * 
 * @example
 * ```tsx
 * const { trackFile, cleanup, clear } = useUploadedFilesTracker({
 *   cleanupEndpoint: '/legal-cases/documents/cleanup',
 *   onCleanup: (ids) => console.log('Deleted:', ids)
 * });
 * 
 * // При загрузке файла
 * const handleUploadSuccess = (upload: any) => {
 *   trackFile(upload.response.id, upload.response.name, upload.response.url);
 * };
 * 
 * // При отмене
 * const handleCancel = async () => {
 *   await cleanup();
 * };
 * 
 * // При успешном сохранении
 * const handleSave = () => {
 *   clear(); // Просто очищаем список, файлы остаются
 * };
 * ```
 */
export function useUploadedFilesTracker({
  cleanupEndpoint,
  fileIdsField = 'fileIds',
  cleanupOnUnmount = false,
  onCleanup,
  onError,
}: UseUploadedFilesTrackerOptions): UseUploadedFilesTrackerReturn {
  const filesRef = useRef<UploadedFile[]>([]);
  const isCleaningRef = useRef(false);
  const cleanupCalledRef = useRef(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isCleaning, setIsCleaning] = useState(false);

  const trackFile = useCallback((id: string, name?: string, url?: string) => {
    filesRef.current.push({
      id,
      name: name || 'Unknown',
      url,
      uploadedAt: new Date(),
    });
    setUploadedFiles([...filesRef.current]);
  }, []);

  const trackFiles = useCallback((files: Array<{ id: string; name?: string; url?: string }>) => {
    files.forEach(({ id, name, url }) => {
      filesRef.current.push({
        id,
        name: name || 'Unknown',
        url,
        uploadedAt: new Date(),
      });
    });
    setUploadedFiles([...filesRef.current]);
  }, []);

  const untrackFile = useCallback((fileId: string) => {
    filesRef.current = filesRef.current.filter(f => f.id !== fileId);
    setUploadedFiles([...filesRef.current]);
  }, []);

  const clear = useCallback(() => {
    filesRef.current = [];
    setUploadedFiles([]);
  }, []);

  const cleanup = useCallback(async () => {
    if (isCleaningRef.current || cleanupCalledRef.current) {
      return;
    }

    const fileIds = filesRef.current.map(f => f.id);
    if (fileIds.length === 0) {
      return;
    }

    isCleaningRef.current = true;
    setIsCleaning(true);
    cleanupCalledRef.current = true;

    try {
      await api.post(cleanupEndpoint, {
        [fileIdsField]: fileIds
      });

      console.log('[UploadedFilesTracker] Cleaned up', fileIds.length, 'files:', fileIds);
      onCleanup?.(fileIds);
      filesRef.current = [];
      setUploadedFiles([]);
    } catch (error) {
      console.error('[UploadedFilesTracker] Cleanup error:', error);
      onError?.(error as Error, fileIds);
      throw error;
    } finally {
      isCleaningRef.current = false;
      setIsCleaning(false);
    }
  }, [cleanupEndpoint, fileIdsField, onCleanup, onError]);

  // Cleanup on unmount if enabled
   
  React.useEffect(() => {
    return () => {
      if (cleanupOnUnmount && !cleanupCalledRef.current) {
        cleanup().catch(console.error);
      }
    };
  }, [cleanupOnUnmount, cleanup]);

  return {
    uploadedFiles,
    trackFile,
    trackFiles,
    untrackFile,
    cleanup,
    clear,
    count: uploadedFiles.length,
    isCleaning,
  };
}
