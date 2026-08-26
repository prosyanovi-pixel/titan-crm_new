export interface Mail {
  id: string;
  subject: string;
  sender: {
    name: string;
    email: string;
    avatar?: string;
  };
  recipients: string[];
  cc?: string[];
  bcc?: string[];
  content: string;
  htmlContent?: string;
  timestamp: string;
  folder: 'inbox' | 'sent' | 'drafts' | 'trash' | 'archive' | 'spam';
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  attachments?: Attachment[];
  labels?: string[];
  accountEmail?: string;
  // Дополнительные поля для улучшенного отображения
  categoryId?: string; // Для категорий (заказы, счета и т.д.)
  isOfficial?: boolean; // Для официальных писем (гос. органы, банки)
  sendStatus?: 'pending' | 'retrying' | 'failed' | 'sent'; // Статус отправки для писем в "Отправленных"
  answered?: boolean; // Ответили на письмо
  replied?: boolean; // Альтернативное имя поля для ответа
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface MailFolder {
  id: string;
  name: string;
  icon: string;
  count: number;
  unreadCount: number;
}

export interface MailFilters {
  search: string;
  folder: string;
  labels: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
}

// Типы для API (используются в transformMailData)
export interface MailApiItem {
  id?: string;
  subject?: string;
  sender?: string | { name: string; email: string; avatar?: string };
  senderEmail?: string;
  sender_email?: string;
  avatar?: string;
  content?: string;
  date?: string;
  timestamp?: string;
  read?: boolean;
  isRead?: boolean;
  label?: string;
  folder?: string;
  folderId?: string;
  folder_id?: string;
  isStarred?: boolean;
  is_starred?: boolean;
  hasAttachments?: boolean;
  has_attachments?: boolean;
  attachments?: unknown[];
  htmlContent?: string;
  html_content?: string;
  recipients?: string[];
  cc?: string[];
  bcc?: string[];
  sendStatus?: 'pending' | 'retrying' | 'failed' | 'sent';
  createdAt?: string;
  answered?: boolean;
  imapFlags?: string[];
  imap_flags?: string[];
  accountEmail?: string;
  account_email?: string;
}

export interface MailAccount {
  id: string;
  email: string;
  displayName?: string;
  accountType?: string;
  isDefault?: boolean;
  isActive?: boolean;
  includeSubfolders?: boolean;
  syncFolders?: string[] | null;
}

export interface ApiMailFolder {
  id: string;
  folderName: string;
  folderType: string;
  unseenCount: number;
  totalCount: number;
  displayOrder?: number;
  isVisible?: boolean;
  isSyncEnabled?: boolean;
  parentFolderId?: string | null;
  parent_folder_id?: string | null;
  accountId?: string;
  imapFolderPath?: string;
}

// Типы для фильтрации и сортировки
export type MailFilterType = 'all' | 'unread' | 'starred' | 'attachments' | 'social' | 'newsletters' | 'government' | 'orders' | 'finance';
export type MailSortType = 'date-desc' | 'date-asc' | 'sender-asc' | 'sender-desc' | 'subject-asc' | 'subject-desc';

// Тип для WebSocket событий
export interface MailSyncStatus {
  status: 'completed' | 'in_progress' | 'failed';
  accountId: string;
  folderId?: string;
  processed?: number;
  total?: number;
}

// Тип для контекстного меню
export type MailContextMenuAction =
  | 'open'
  | 'reply'
  | 'replyAll'
  | 'forward'
  | 'markRead'
  | 'moveToFolder'
  | 'delete'
  | 'spam'
  | 'addLabel'
  | 'createLabel'
  | 'createEvent'
  | 'createFilter'
  | 'findSimilar'
  | 'archive'
  | 'print';