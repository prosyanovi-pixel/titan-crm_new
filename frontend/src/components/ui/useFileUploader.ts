import { useState, useCallback } from 'react';
import { UploadFile, UseFileUploaderProps, UseFileUploaderReturn } from './FileUploader.types';
import { api } from '@/lib/api';

/**
 * Хук для управления загрузкой файлов
 * Использует центральный api из @/lib/api
 */
export function useFileUploader({
  uploadUrl,
  headers = {},
  formDataFields = {},
  fileFieldName = 'file',
  onUploadStart,
  onProgress,
  onSuccess,
  onError,
}: UseFileUploaderProps): UseFileUploaderReturn {
  const [uploads, setUploads] = useState<UploadFile[]>([]);

  const createUpload = useCallback((file: File, customName?: string): UploadFile => ({
    id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    file,
    name: customName || file.name,
    size: file.size,
    progress: 0,
    status: 'pending',
  }), []);

  const uploadFile = useCallback(async (file: File, customName?: string): Promise<UploadFile> => {
    const upload = createUpload(file, customName);
    
    setUploads(prev => [...prev, upload]);
    onUploadStart?.(upload);

    try {
      const formData = new FormData();
      formData.append(fileFieldName, file);

      // Add custom fields
      Object.entries(formDataFields).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Build full URL - api.post already handles VITE_API_URL which includes /api
      // Just ensure the URL starts with /
      const fullUploadUrl = uploadUrl.startsWith('http') 
        ? uploadUrl 
        : uploadUrl.startsWith('/') 
          ? uploadUrl 
          : `/${uploadUrl}`;

      // Use central api.post which handles VITE_API_URL and headers
      const response = await api.post(fullUploadUrl, formData, {
        headers,
      });

      const completedUpload = {
        ...upload,
        progress: 100,
        status: 'completed' as const,
        response
      };

      setUploads(prev => prev.map(u =>
        u.id === upload.id ? completedUpload : u
      ));
      // Note: onSuccess is called by FileUploader component, not here to prevent duplicates
      return completedUpload;
    } catch (error) {
      const errorUpload = { 
        ...upload, 
        status: 'error' as const, 
        error: (error as Error).message 
      };
      setUploads(prev => prev.map(u => u.id === upload.id ? errorUpload : u));
      onError?.(errorUpload);
      throw error;
    }
  }, [uploadUrl, headers, formDataFields, fileFieldName, createUpload, onUploadStart, onError]);

  const uploadFiles = useCallback(async (files: File[]): Promise<UploadFile[]> => {
    const results = await Promise.all(
      files.map(file => uploadFile(file).catch(e => null))
    );
    return results.filter((r): r is UploadFile => r !== null);
  }, [uploadFile]);

  const cancelUpload = useCallback((uploadId: string) => {
    // Note: api.post doesn't support abort, but we can remove from tracking
    setUploads(prev => prev.filter(u => u.id !== uploadId));
  }, []);

  const cancelAllUploads = useCallback(() => {
    setUploads(prev => prev.filter(u => u.status !== 'uploading' && u.status !== 'pending'));
  }, []);

  const removeUpload = useCallback((uploadId: string) => {
    setUploads(prev => prev.filter(u => u.id !== uploadId));
  }, []);

  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(u => u.status !== 'completed'));
  }, []);

  const isUploading = uploads.some(u => u.status === 'uploading' || u.status === 'pending');

  return {
    uploads,
    isUploading,
    uploadFile,
    uploadFiles,
    cancelUpload,
    cancelAllUploads,
    removeUpload,
    clearCompleted,
  };
}
