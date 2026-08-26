import { Mail, Attachment, MailApiItem, MailFilterType, MailSortType } from '../types';

/**
 * Трансформирует вложение из формата API в формат фронтенда
 */
export const transformAttachment = (attachment: unknown): Attachment => {
  const att = attachment as { id?: string; name?: string; filename?: string; size?: number; file_size?: number; type?: string; content_type?: string; url?: string; stored_path?: string };
  return {
    id: att?.id || '',
    name: att?.name || att?.filename || 'attachment',
    size: Number(att?.size ?? att?.file_size ?? 0),
    type: att?.type || att?.content_type || '',
    url: att?.url || att?.stored_path || '',
  };
};

/**
 * Трансформирует данные письма из формата API в формат фронтенда
 */
export const transformMailData = (data: MailApiItem[]): Mail[] => {
  return data.map((item, index) => {
    // Обработка даты - пробуем разные форматы
    let timestamp = new Date().toISOString();
    const rawDate = item.date || item.timestamp || item.createdAt;
    if (rawDate) {
      try {
        const parsedDate = new Date(rawDate);

        if (!isNaN(parsedDate.getTime())) {
          timestamp = parsedDate.toISOString();
        } else if (typeof rawDate === 'string') {
          // Попытка исправить формат "YYYY-MM-DD HH:MM:SS.SSS+TZ" для старых браузеров
          let fixedDateStr = rawDate.trim();
          if (fixedDateStr.includes(' ') && !fixedDateStr.includes('T')) {
            fixedDateStr = fixedDateStr.replace(' ', 'T');
          }
          // Исправляем смещение часового пояса без минут (например, +03 -> +03:00)
          if (/[+-]\d{1,2}$/.test(fixedDateStr)) {
            fixedDateStr += ':00';
          }
          const secondAttempt = new Date(fixedDateStr);
          if (!isNaN(secondAttempt.getTime())) {
            timestamp = secondAttempt.toISOString();
          } else {
            console.warn('Invalid date format:', rawDate);
          }
        } else {
          console.warn('Invalid date format:', rawDate);
        }
      } catch (error) {
        console.warn('Error parsing date:', rawDate, error);
      }
    }

    const attachments = Array.isArray(item.attachments)
      ? item.attachments.map(transformAttachment)
      : [];

    const hasAttachmentsFlag = item.hasAttachments ?? item.has_attachments;
    const hasAttachments = Boolean(hasAttachmentsFlag) || attachments.length > 0;

    // Определяем отправителя
    let senderName: string;
    let senderEmail: string;
    let avatar = undefined;

    if (item.sender && typeof item.sender === 'object') {
      const sender = item.sender as { name?: string; email?: string; avatar?: string };
      senderName = sender.name || '';
      senderEmail = sender.email || '';
      avatar = sender.avatar;
    } else if (typeof item.sender === 'string') {
      senderName = item.sender;
      senderEmail = item.senderEmail || item.sender_email || '';
    } else {
      // Если sender не определен или null/undefined
      senderName = '';
      senderEmail = item.senderEmail || item.sender_email || '';
    }

    return {
      id: item.id || `temp-${index}`,
      subject: item.subject || '',
      sender: {
        name: senderName,
        email: senderEmail,
        avatar,
      },
      recipients: item.recipients || [],
      cc: item.cc || [],
      bcc: item.bcc || [],
      content: item.content || '',
      htmlContent: item.htmlContent || item.html_content || undefined,
      timestamp,
      folder: (item.folder || item.folderId || item.folder_id || 'inbox') as Mail['folder'],
      isRead: Boolean(item.isRead ?? item.read),
      isStarred: Boolean(item.isStarred ?? item.is_starred),
      answered: Boolean(item.answered || (item.imapFlags || item.imap_flags)?.includes('\\Answered')),
      hasAttachments,      attachments,
      labels: item.label ? [item.label] : [],
      sendStatus: item.sendStatus || undefined,
      accountEmail: item.accountEmail || item.account_email || undefined,
    };
  });
};

/**
 * Фильтрует и сортирует письма согласно заданным параметрам
 */
export const filterAndSortMails = (
  mails: Mail[],
  options: {
    searchQuery?: string;
    mailFilter?: MailFilterType;
    mailSort?: MailSortType;
  }
): Mail[] => {
  const { searchQuery = '', mailFilter = 'all', mailSort = 'date-desc' } = options;

  return mails
    .filter(mail => {
      // Фильтр по типу
      if (mailFilter === 'unread' && mail.isRead) return false;
      if (mailFilter === 'starred' && !mail.isStarred) return false;
      if (mailFilter === 'attachments' && !mail.hasAttachments) return false;
      
      // Поиск по отправителю, теме, содержимому
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const senderName = mail.sender.name?.toLowerCase() || '';
        const senderEmail = mail.sender.email?.toLowerCase() || '';
        const subject = mail.subject?.toLowerCase() || '';
        const content = mail.content?.toLowerCase() || '';
        
        const matchesSearch = 
          senderName.includes(query) ||
          senderEmail.includes(query) ||
          subject.includes(query) ||
          content.includes(query);
        
        if (!matchesSearch) return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Сортировка
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      const senderA = (a.sender.name || a.sender.email || '').toLowerCase();
      const senderB = (b.sender.name || b.sender.email || '').toLowerCase();
      const subjectA = (a.subject || '').toLowerCase();
      const subjectB = (b.subject || '').toLowerCase();
      
      switch (mailSort) {
        case 'date-desc':
          return dateB - dateA;
        case 'date-asc':
          return dateA - dateB;
        case 'sender-asc':
          return senderA.localeCompare(senderB);
        case 'sender-desc':
          return senderB.localeCompare(senderA);
        case 'subject-asc':
          return subjectA.localeCompare(subjectB);
        case 'subject-desc':
          return subjectB.localeCompare(subjectA);
        default:
          return 0;
      }
    });
};

/**
 * Форматирует размер файла в читаемый вид
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Извлекает домен из email адреса
 */
export const getEmailDomain = (email: string): string => {
  const atIndex = email.indexOf('@');
  return atIndex !== -1 ? email.substring(atIndex + 1) : '';
};

/**
 * Форматирует дату в относительное время (например, "2 часа назад")
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'только что';
  if (diffMinutes < 60) return `${diffMinutes} мин. назад`;
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffDays === 1) return 'вчера';
  if (diffDays < 7) return `${diffDays} дн. назад`;
  
  // Для более старых дат используем форматирование даты
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: diffDays > 365 ? 'numeric' : undefined,
  });
};