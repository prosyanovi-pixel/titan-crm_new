import { 
  FileText, 
  FileImage, 
  FileArchive, 
  FileSpreadsheet, 
  FileType, 
  File,
  LucideIcon
} from 'lucide-react';
import { Attachment } from '../types';
import { fixMojibake } from './componentUtils';

/**
 * Определение иконки для типа файла
 */
export const getFileIcon = (attachment: Partial<Attachment> | undefined): LucideIcon => {
  const name = (attachment?.name || '').toLowerCase();
  const type = (attachment?.type || '').toLowerCase();
  const ext = name.includes('.') ? name.split('.').pop() || '' : '';

  if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) {
    return FileImage;
  }

  if (type === 'application/pdf' || ext === 'pdf') {
    return FileType;
  }

  if (['xlsx', 'xls', 'csv', 'ods'].includes(ext)) {
    return FileSpreadsheet;
  }

  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return FileArchive;
  }

  if (['doc', 'docx', 'rtf', 'txt', 'odt'].includes(ext)) {
    return FileText;
  }

  return File;
};

/**
 * Можно ли отобразить превью для вложения
 */
export const isPreviewable = (attachment: Partial<Attachment> | undefined): boolean =>
  Boolean(attachment?.type?.startsWith('image/') || attachment?.type === 'application/pdf');

/**
 * Нормализация данных вложения из API
 */
export const normalizeAttachment = (attachment: unknown): Attachment => {
  const att = attachment as { id?: string; name?: string; filename?: string; size?: number; file_size?: number; type?: string; content_type?: string; url?: string; stored_path?: string };
  return {
    id: att?.id || '',
    name: fixMojibake(att?.name || att?.filename || 'attachment'),
    size: Number(att?.size ?? att?.file_size ?? 0),
    type: att?.type || att?.content_type || '',
    url: att?.url || att?.stored_path || '',
  };
};
