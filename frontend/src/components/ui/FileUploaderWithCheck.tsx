import React, { useState } from 'react';
import { FileUploader } from './FileUploader';
import { useFileExistsCheck } from './useFileExistsCheck';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './dialog';
import { Button } from './button';
import { AlertCircle, FileWarning, Upload, Copy, Link } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export interface FileExistsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  existingFile?: {
    url?: string;
    uploadedAt?: string;
    usedIn?: Array<{
      entityType: string;
      entityId: string;
      entityName?: string;
    }>;
  };
  onUploadNew: () => void;
  onUseExisting?: () => void;
  onViewExisting?: () => void;
}

/**
 * Диалог подтверждения при обнаружении дубликата файла
 */
export function FileExistsDialog({
  open,
  onOpenChange,
  fileName,
  existingFile,
  onUploadNew,
  onUseExisting,
  onViewExisting,
}: FileExistsDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            {t('common.uploader.exists_dialog.title')}
          </DialogTitle>
          <DialogDescription>
            {t('common.uploader.exists_dialog.description', { name: fileName })}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
            <FileWarning className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm space-y-2">
              <p className="text-amber-900 dark:text-amber-100">
                {t('common.uploader.exists_dialog.warning')}
              </p>
              {existingFile?.usedIn && existingFile.usedIn.length > 0 && (
                <div className="space-y-1">
                  <p className="text-amber-800 dark:text-amber-200 font-medium">
                    {t('common.uploader.exists_dialog.used_in')}
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-700 dark:text-amber-300">
                    {existingFile.usedIn.slice(0, 3).map((use, i) => (
                      <li key={i}>
                        {use.entityName || `${use.entityType} #${use.entityId}`}
                      </li>
                    ))}
                    {existingFile.usedIn.length > 3 && (
                      <li>{t('common.uploader.exists_dialog.more_items', { count: existingFile.usedIn.length - 3 })}</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {onViewExisting && (
            <Button
              variant="outline"
              onClick={onViewExisting}
              className="gap-2"
            >
              <Link className="w-4 h-4" />
              {t('common.uploader.exists_dialog.view_existing')}
            </Button>
          )}
          {onUseExisting && (
            <Button
              variant="outline"
              onClick={onUseExisting}
              className="gap-2"
            >
              <Copy className="w-4 h-4" />
              {t('common.uploader.exists_dialog.use_existing')}
            </Button>
          )}
          <Button
            onClick={onUploadNew}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            {t('common.uploader.exists_dialog.upload_new')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface FileUploaderWithCheckProps extends Omit<React.ComponentProps<typeof FileUploader>, 'onSuccess'> {
  /** API endpoint для проверки существования */
  checkEndpoint: string;
  
  /** Поле имени файла в запросе проверки */
  fileNameField?: string;
  
  /** Поле хэша файла в запросе проверки */
  fileHashField?: string;
  
  /** Вычислять хэш файла (по умолчанию true) */
  computeHash?: boolean;
  
  /** Callback при успешной загрузке (с результатом проверки) */
  onSuccess?: (upload: any, checkResult?: any) => void;
  
  /** Callback при использовании существующего файла */
  onUseExisting?: (existingFile: any) => void;
}

/**
 * FileUploader с проверкой на дубликаты
 * 
 * @example
 * ```tsx
 * <FileUploaderWithCheck
 *   uploadUrl="/api/upload"
 *   checkEndpoint="/api/documents/check-exists"
 *   computeHash={true}
 *   onSuccess={(upload, checkResult) => {
 *     if (checkResult?.exists) {
 *       console.log('Использован существующий файл');
 *     } else {
 *       console.log('Загружен новый файл');
 *     }
 *   }}
 * />
 * ```
 */
export function FileUploaderWithCheck({
  checkEndpoint,
  fileNameField = 'fileName',
  fileHashField = 'fileHash',
  computeHash = true,
  onSuccess,
  onUseExisting,
  ...fileUploaderProps
}: FileUploaderWithCheckProps) {
  const { t } = useTranslation();
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<any>(null);
  const [checkResult, setCheckResult] = useState<any>(null);

  const { checkFile, isChecking } = useFileExistsCheck({
    checkEndpoint,
    fileNameField,
    fileHashField,
    computeHash,
    onDuplicateFound: (result) => {
      setCheckResult(result);
      setShowDuplicateDialog(true);
    },
  });

  const handleUploadWithCheck = async (upload: any) => {
    // Сначала проверяем файл
    if (pendingFile) {
      try {
        const result = await checkFile(pendingFile);
        
        if (!result.exists) {
          // Файл не существует - продолжаем загрузку
          onSuccess?.(upload, result);
        }
        // Если файл существует, диалог уже показан в onDuplicateFound
      } catch (error) {
        console.error('File check error:', error);
        // При ошибке проверки всё равно загружаем
        onSuccess?.(upload, null);
      }
    } else {
      onSuccess?.(upload, checkResult);
    }
  };

  const handleConfirmUploadNew = () => {
    // Пользователь решил загрузить новый файл несмотря на дубликат
    setShowDuplicateDialog(false);
    if (pendingFile) {
      // Загружаем файл (FileUploader уже начал загрузку)
      onSuccess?.(pendingFile, checkResult);
    }
    setPendingFile(null);
    setCheckResult(null);
  };

  const handleConfirmUseExisting = () => {
    // Пользователь решил использовать существующий файл
    setShowDuplicateDialog(false);
    onUseExisting?.(checkResult);
    setPendingFile(null);
    setCheckResult(null);
  };

  const handleViewExisting = () => {
    if (checkResult?.existingFile?.url) {
      window.open(checkResult.existingFile.url, '_blank');
    }
  };

  return (
    <>
      <FileUploader
        {...fileUploaderProps}
        onSuccess={handleUploadWithCheck}
        disabled={isChecking || fileUploaderProps.disabled}
      />

      <FileExistsDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        fileName={pendingFile?.name || checkResult?.fileName || t('common.uploader.file')}
        existingFile={checkResult}
        onUploadNew={handleConfirmUploadNew}
        onUseExisting={onUseExisting ? handleConfirmUseExisting : undefined}
        onViewExisting={handleViewExisting}
      />
    </>
  );
}
