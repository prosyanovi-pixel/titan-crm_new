/**
 * File Upload Component
 * Handle contract file uploads
 */

import React, { useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useUploadContractFiles, useContractFiles, useDeleteContractFile } from '../hooks';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Upload, Trash2, Download } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { Loader2 } from 'lucide-react';

interface FileUploadProps {
  contractId: string;
}

export function FileUpload({ contractId }: FileUploadProps) {
  const { t } = useTranslation();
  const { data: files, isLoading } = useContractFiles(contractId);
  const uploadMutation = useUploadContractFiles(contractId);
  const deleteMutation = useDeleteContractFile(contractId);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        uploadMutation.mutate(droppedFiles);
      }
    },
    [uploadMutation]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadMutation.mutate(Array.from(e.target.files));
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">{t('general.loading')}</div>;
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-8 text-center transition-colors hover:border-muted-foreground/50"
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-2 font-medium text-muted-foreground">{t('contracts.files.dialogs.drag_drop')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t('contracts.files.dialogs.max_size')}</p>
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          disabled={uploadMutation.isPending}
        />
        <label htmlFor="file-upload">
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('contracts.files.actions.upload')}
          </Button>
        </label>
      </div>

      {/* Files Table */}
      {files && files.length > 0 ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('general.name')}</TableHead>
                <TableHead>{t('contracts.files.table.size')}</TableHead>
                <TableHead>{t('contracts.files.table.uploaded_by')}</TableHead>
                <TableHead>{t('contracts.files.table.uploaded_at')}</TableHead>
                <TableHead>{t('contracts.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium">{file.originalName}</TableCell>
                  <TableCell>{file.fileSize ? formatFileSize(file.fileSize) : '—'}</TableCell>
                  <TableCell>{file.uploadedBy}</TableCell>
                  <TableCell>{formatDate(file.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <a href={file.filePath} download>
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{t('general.delete')}</DialogTitle>
                            <DialogDescription>
                              {t('contracts.files.dialogs.delete_confirm')}
                            </DialogDescription>
                          </DialogHeader>
                          <Button
                            onClick={() => deleteMutation.mutate(file.id)}
                            disabled={deleteMutation.isPending}
                            variant="destructive"
                          >
                            {deleteMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {t('general.delete')}
                          </Button>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">{t('contracts.files.empty')}</p>
        </div>
      )}
    </div>
  );
}
