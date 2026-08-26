/**
 * Типы для компонента FileUploader
 */

export interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  response?: any;
}

export interface FileUploaderProps {
  /** URL эндпоинта для загрузки */
  uploadUrl: string;
  
  /** Дополнительные заголовки */
  headers?: Record<string, string>;
  
  /** Дополнительные FormData поля */
  formDataFields?: Record<string, string>;
  
  /** Поле имени для файла в FormData */
  fileFieldName?: string;
  
  /** Максимальный размер файла в байтах */
  maxSize?: number;
  
  /** Разрешённые типы файлов */
  accept?: string;
  
  /** Множественная загрузка файлов */
  multiple?: boolean;
  
  /** Автоматическая загрузка после выбора */
  autoUpload?: boolean;
  
  /** Кастомное имя файла */
  getFileName?: (file: File) => string;
  
  /** Callback при начале загрузки */
  onUploadStart?: (upload: UploadFile) => void;
  
  /** Callback прогресса загрузки */
  onProgress?: (upload: UploadFile) => void;
  
  /** Callback успешной загрузки */
  onSuccess?: (upload: UploadFile) => void;
  
  /** Callback ошибки загрузки */
  onError?: (upload: UploadFile) => void;
  
  /** Callback завершения всех загрузок */
  onAllComplete?: (uploads: UploadFile[]) => void;
  
  /** Callback при выборе файла (без загрузки) */
  onSelectFile?: (file: File) => void;
  
  /** Пропустить загрузку, только выбор файла */
  skipUpload?: boolean;

  /** Класс контейнера */
  className?: string;
  
  /** Текст кнопки */
  buttonText?: string;
  
  /** Показывать список загрузок */
  showUploadList?: boolean;
  
  /** Показывать кнопку отмены */
  showCancelButton?: boolean;
  
  /** Показывать иконку файла */
  showFileIcon?: boolean;
  
  /** Отключить компонент */
  disabled?: boolean;
  
  /** Drag & Drop зона */
  dropzone?: boolean;
  
  /** Текст drag & drop зоны */
  dropzoneText?: string;
}

export interface UseFileUploaderProps {
  uploadUrl: string;
  headers?: Record<string, string>;
  formDataFields?: Record<string, string>;
  fileFieldName?: string;
  onUploadStart?: (upload: UploadFile) => void;
  onProgress?: (upload: UploadFile) => void;
  onSuccess?: (upload: UploadFile) => void;
  onError?: (upload: UploadFile) => void;
}

export interface UseFileUploaderReturn {
  uploads: UploadFile[];
  isUploading: boolean;
  uploadFile: (file: File, customName?: string) => Promise<UploadFile>;
  uploadFiles: (files: File[]) => Promise<UploadFile[]>;
  cancelUpload: (uploadId: string) => void;
  cancelAllUploads: () => void;
  removeUpload: (uploadId: string) => void;
  clearCompleted: () => void;
}
