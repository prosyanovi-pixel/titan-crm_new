import { useState, useMemo } from 'react';
import { Mail } from '../../types';
import { MailCategorySettings } from '../../context/mailCategories';

interface UseMailViewStateProps {
  allMails: Mail[];
  mailFilter: string;
  categories: MailCategorySettings;
}

interface UseMailViewStateReturn {
  selectedMail: Mail | null;
  setSelectedMail: (mail: Mail | null) => void;
  filteredMails: Mail[];
}

/**
 * Хук для управления выбранным письмом и отфильтрованными письмами
 * ~100 строк
 */
export function useMailViewState({
  allMails,
  mailFilter,
  categories,
}: UseMailViewStateProps): UseMailViewStateReturn {
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);

  // Логика фильтрации писем (из исходного MailContext)
  const filteredMails = useMemo(() => {
    if (['all', 'unread', 'starred', 'attachments'].includes(mailFilter)) {
      if (mailFilter === 'all') return allMails;
      if (mailFilter === 'unread') return allMails.filter(m => !m.isRead);
      if (mailFilter === 'starred') return allMails.filter(m => m.isStarred);
      if (mailFilter === 'attachments') return allMails.filter(m => m.hasAttachments);
      return allMails;
    }

    // Локальная фильтрация по категориям
    const category = categories.find(c => c.id === mailFilter);
    if (!category) return allMails;

    const keywordsStr = category.keywords || '';
    if (!keywordsStr.trim()) return allMails;

    const keywords = keywordsStr.split(',').map(k => k.trim()).filter(Boolean);
    if (keywords.length === 0) return allMails;

    const pattern = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(pattern, 'i');

    return allMails.filter(mail => {
      const senderStr = (typeof mail.sender === 'object' ? mail.sender?.name || mail.sender?.email : mail.sender || '');
      const fullText = `${senderStr} ${mail.subject} ${mail.content || ''}`;
      return regex.test(fullText);
    });
  }, [allMails, mailFilter, categories]);

  return {
    selectedMail,
    setSelectedMail,
    filteredMails,
  };
}
