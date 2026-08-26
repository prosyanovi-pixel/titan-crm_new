import React, { useRef, useCallback, useState } from 'react';
import { Upload, File, X, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Progress } from './progress';
import { useFileUploader } from './useFileUploader';
import type { FileUploaderProps, UploadFile } from './FileUploader.types';
import { useTranslation } from '@/lib/i18n';

/**
 * Универсальный компонент загрузки файлов
 * 
 * @example
 * ```tsx
 * <FileUploader
 *   uploadUrl="/api/upload"
 *   headers={{ 'x-user-id': userId }}
 *   accept=".pdf,.doc,.docx"
 *   maxSize={10 * 1024 * 1024}
 *   onSuccess={(upload) => console.log('Uploaded:', upload.response)}
 * />
 * ```
 */
export function FileUploader({
  uploadUrl,
  headers = {},
  formDataFields = {},
  fileFieldName = 'file',
  maxSize,
  accept = '*/*',
  multiple = false,
  autoUpload = true,
  getFileName,
  onUploadStart,
  onProgress,
  onSuccess,
  onError,
  onAllComplete,
  className,
  buttonText,
  showUploadList = true,
  showCancelButton = true,
  showFileIcon = true,
  disabled = false,
  dropzone = false,
  dropzoneText,
  onSelectFile,
  skipUpload = false,
}: FileUploaderProps) {
  const { t } = useTranslation();
  const finalButtonText = buttonText || t('common.uploader.select_files');
  const finalDropzoneText = dropzoneText || t('common.uploader.dropzone_text');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [customNames, setCustomNames] = useState<Record<string, string>>({});

  const {
    uploads,
    isUploading,
    uploadFile,
    uploadFiles,
    cancelUpload,
    removeUpload,
    clearCompleted,
  } = useFileUploader({
    uploadUrl,
    headers,
    formDataFields,
    fileFieldName,
    onUploadStart,
    onProgress,
    onSuccess,
    onError,
  });

  const validateFile = useCallback((file: File): boolean => {
    if (maxSize && file.size > maxSize) {
      alert(t('common.uploader.error_size', { name: file.name, size: formatFileSize(maxSize) }));
      return false;
    }
    return true;
  }, [maxSize, t]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const filesArray = Array.from(files);
    const validFiles = filesArray.filter(validateFile);

    if (validFiles.length === 0) return;

    // Если skipUpload - просто вызываем onSelectFile для каждого файла
    if (skipUpload && onSelectFile) {
      validFiles.forEach(file => onSelectFile(file));
      return;
    }

    if (autoUpload) {
      const results = await uploadFiles(validFiles);
      // Call onSuccess for each successfully uploaded file
      results.forEach(result => {
        onSuccess?.(result);
      });
      if (results.length > 0 && results.length === validFiles.length) {
        onAllComplete?.(results);
      }
    } else {
      // Add to pending list (for manual upload)
      validFiles.forEach(file => {
        // Implementation for manual upload mode
      });
    }
  }, [autoUpload, uploadFiles, validateFile, onAllComplete, onSuccess, skipUpload, onSelectFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCancelUpload = useCallback((uploadId: string) => {
    cancelUpload(uploadId);
  }, [cancelUpload]);

  const handleRemoveUpload = useCallback((uploadId: string) => {
    removeUpload(uploadId);
  }, [removeUpload]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone / Button */}
      {dropzone ? (
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
            dragOver 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={!disabled ? handleButtonClick : undefined}
        >
          <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">{finalDropzoneText}</p>
          <p className="text-xs text-muted-foreground">
            {accept !== '*/*' && t('common.uploader.allowed_formats', { formats: accept })}
            {maxSize && ` • ${t('common.uploader.max_size', { size: formatFileSize(maxSize) })}`}
          </p>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={accept}
            multiple={multiple}
            onChange={handleFileSelect}
            disabled={disabled}
          />
          <Button
            variant="outline"
            onClick={handleButtonClick}
            disabled={disabled || isUploading}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            {finalButtonText}
          </Button>
        </div>
      )}

      {/* Upload List */}
      {showUploadList && uploads.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">{t('common.uploader.uploads_count', { count: uploads.length })}</h4>
            {uploads.some(u => u.status === 'completed') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCompleted}
                className="text-xs"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                {t('common.uploader.clear_completed')}
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {uploads.map((upload) => (
              <UploadListItem
                key={upload.id}
                upload={upload}
                showFileIcon={showFileIcon}
                showCancelButton={showCancelButton}
                onCancel={handleCancelUpload}
                onRemove={handleRemoveUpload}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Компонент элемента загрузки
function UploadListItem({
  upload,
  showFileIcon,
  showCancelButton,
  onCancel,
  onRemove,
}: {
  upload: UploadFile;
  showFileIcon: boolean;
  showCancelButton: boolean;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { t } = useTranslation();
  const formatStatus = () => {
    switch (upload.status) {
      case 'uploading':
        return `${upload.progress}%`;
      case 'completed':
        return t('common.status_completed');
      case 'error':
        return upload.error || t('common.error');
      default:
        return t('common.uploader.status_pending');
    }
  };

  const getStatusIcon = () => {
    switch (upload.status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border',
        upload.status === 'completed' && 'bg-green-50/50 border-green-200',
        upload.status === 'error' && 'bg-destructive/5 border-destructive/20'
      )}
    >
      {showFileIcon && (
        <div className={cn(
          'w-8 h-8 rounded flex items-center justify-center shrink-0',
          upload.status === 'completed' 
            ? 'bg-green-100 text-green-600'
            : upload.status === 'error'
            ? 'bg-destructive/10 text-destructive'
            : 'bg-muted text-muted-foreground'
        )}>
          <File className="w-4 h-4" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-sm font-medium truncate">{upload.name}</p>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">
              {formatStatus()}
            </span>
            {getStatusIcon()}
          </div>
        </div>

        {upload.status === 'uploading' ? (
          <div className="flex items-center gap-2">
            <Progress value={upload.progress} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground shrink-0">
              {formatFileSize(upload.size)}
            </span>
            {showCancelButton && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => onCancel(upload.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {formatFileSize(upload.size)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(upload.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Утилиты
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
