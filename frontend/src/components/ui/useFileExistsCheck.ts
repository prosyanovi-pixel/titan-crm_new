import { useState, useCallback } from 'react';
import { api } from '@/lib/api';

export interface FileExistsCheckResult {
  exists: boolean;
  fileId?: string;
  fileName?: string;
  url?: string;
  uploadedAt?: string;
  usedIn?: Array<{
    entityType: string;
    entityId: string;
    entityName?: string;
  }>;
}

export interface UseFileExistsCheckOptions {
  /** API endpoint для проверки (например, '/documents/check-exists') */
  checkEndpoint: string;
  
  /** Поле имени файла в запросе (по умолчанию 'fileName') */
  fileNameField?: string;
  
  /** Поле для хэша файла (по умолчанию 'fileHash') */
  fileHashField?: string;
  
  /** Автоматически вычислять хэш файла */
  computeHash?: boolean;
  
  /** Callback при обнаружении дубликата */
  onDuplicateFound?: (result: FileExistsCheckResult) => void;
}

export interface UseFileExistsCheckReturn {
  /** Результат последней проверки */
  checkResult: FileExistsCheckResult | null;
  
  /** Идет ли сейчас проверка */
  isChecking: boolean;
  
  /** Ошибка проверки */
  error: Error | null;
  
  /** Проверить файл по имени */
  checkByFileName: (fileName: string) => Promise<FileExistsCheckResult>;
  
  /** Проверить файл по хэшу */
  checkByHash: (fileHash: string) => Promise<FileExistsCheckResult>;
  
  /** Проверить File объект (с вычислением хэша если нужно) */
  checkFile: (file: File) => Promise<FileExistsCheckResult>;
  
  /** Сбросить результат проверки */
  reset: () => void;
}

/**
 * Вычисляет SHA-256 хэш файла
 */
async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Хук для проверки существования файла перед загрузкой
 * 
 * @example
 * ```tsx
 * const { checkFile, isChecking, checkResult } = useFileExistsCheck({
 *   checkEndpoint: '/documents/check-exists',
 *   onDuplicateFound: (result) => {
 *     toast.warning(`Файл уже существует: ${result.fileName}`);
 *   }
 * });
 * 
 * // При выборе файла
 * const handleFileSelect = async (file: File) => {
 *   const result = await checkFile(file);
 *   if (result.exists) {
 *     // Показать диалог с вопросом что делать
 *   } else {
 *     // Загрузить файл
 *   }
 * };
 * ```
 */
export function useFileExistsCheck({
  checkEndpoint,
  fileNameField = 'fileName',
  fileHashField = 'fileHash',
  computeHash = true,
  onDuplicateFound,
}: UseFileExistsCheckOptions): UseFileExistsCheckReturn {
  const [checkResult, setCheckResult] = useState<FileExistsCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkByFileName = useCallback(async (fileName: string): Promise<FileExistsCheckResult> => {
    setIsChecking(true);
    setError(null);

    try {
      const response = await api.post(checkEndpoint, {
        [fileNameField]: fileName,
      });

      const result: FileExistsCheckResult = {
        exists: response.exists,
        fileId: response.fileId,
        fileName: response.fileName,
        url: response.url,
        uploadedAt: response.uploadedAt,
        usedIn: response.usedIn,
      };

      setCheckResult(result);

      if (result.exists && onDuplicateFound) {
        onDuplicateFound(result);
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Check failed');
      setError(error);
      throw error;
    } finally {
      setIsChecking(false);
    }
  }, [checkEndpoint, fileNameField, onDuplicateFound]);

  const checkByHash = useCallback(async (fileHash: string): Promise<FileExistsCheckResult> => {
    setIsChecking(true);
    setError(null);

    try {
      const response = await api.post(checkEndpoint, {
        [fileHashField]: fileHash,
      });

      const result: FileExistsCheckResult = {
        exists: response.exists,
        fileId: response.fileId,
        fileName: response.fileName,
        url: response.url,
        uploadedAt: response.uploadedAt,
        usedIn: response.usedIn,
      };

      setCheckResult(result);

      if (result.exists && onDuplicateFound) {
        onDuplicateFound(result);
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Check failed');
      setError(error);
      throw error;
    } finally {
      setIsChecking(false);
    }
  }, [checkEndpoint, fileHashField, onDuplicateFound]);

  const checkFile = useCallback(async (file: File): Promise<FileExistsCheckResult> => {
    if (computeHash) {
      const hash = await computeFileHash(file);
      return checkByHash(hash);
    } else {
      return checkByFileName(file.name);
    }
  }, [computeHash, checkByFileName, checkByHash]);

  const reset = useCallback(() => {
    setCheckResult(null);
    setError(null);
  }, []);

  return {
    checkResult,
    isChecking,
    error,
    checkByFileName,
    checkByHash,
    checkFile,
    reset,
  };
}
