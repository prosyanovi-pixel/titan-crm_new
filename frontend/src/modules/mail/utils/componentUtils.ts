import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Форматирование даты в стиле Mail.ru
 * Возвращает объект с display (для отображения) и title (полная дата для тултипа)
 */
export function formatMailDate(timestamp: string | number | Date): { display: string; title?: string } {
  try {
    if (!timestamp) {
      console.warn('[formatMailDate] No timestamp provided');
      return { display: '' };
    }

    const date = new Date(timestamp);

    if (isNaN(date.getTime())) {
      console.error('[formatMailDate] Invalid date:', timestamp);
      return { display: '' };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const isToday = date >= today;
    const isYesterday = date >= yesterday && date < today;

    if (isToday) {
      return { display: format(date, 'HH:mm', { locale: ru }), title: `Сегодня, ${format(date, 'H:mm', { locale: ru })}` };
    } else if (isYesterday) {
      return { display: 'Вчера', title: `Вчера, ${format(date, 'H:mm', { locale: ru })}` };
    } else {
      return { display: format(date, 'd MMM', { locale: ru }), title: format(date, 'd MMMM yyyy, H:mm', { locale: ru }) };
    }
  } catch (error) {
    console.error('[formatMailDate] Error formatting date:', error);
    return { display: '' };
  }
}

/**
 * Извлечение букв из строки (для инициалов)
 */
export function extractLetters(value: string): string[] {
  if (!value) return [];
  const matches = value.match(/[A-Za-zА-Яа-я]/g);
  return matches || [];
}

/**
 * Получение инициалов для аватара
 */
export function getInitials(name: string, email: string): string {
  const nameLetters = extractLetters(name);
  if (nameLetters.length >= 2) {
    return `${nameLetters[0]}${nameLetters[1]}`.toUpperCase();
  }
  if (nameLetters.length === 1) {
    return nameLetters[0].toUpperCase();
  }

  if (email) {
    const localPart = email.split('@')[0] || '';
    const emailLetters = extractLetters(localPart);
    if (emailLetters.length >= 2) {
      return `${emailLetters[0]}${emailLetters[1]}`.toUpperCase();
    }
    if (emailLetters.length === 1) {
      return emailLetters[0].toUpperCase();
    }
  }

  return '??';
}

/**
 * Получение отображаемого имени отправителя
 */
export function getDisplayName(name: string, email: string): string {
  const raw = (name || '').trim();
  if (raw) {
    const withoutEmail = raw.replace(/<[^>]*>/g, '').replace(/"/g, '').trim();
    if (withoutEmail) return withoutEmail;
  }

  if (email) {
    const localPart = email.split('@')[0] || '';
    const cleaned = localPart.replace(/[^A-Za-zА-Яа-я0-9]+/g, ' ').trim();
    return cleaned || email;
  }

  return 'Неизвестный';
}

/**
 * Проверка на официальное письмо (гос. органы, банки и т.д.)
 */
export function isOfficialEmail(email: string): boolean {
  if (!email) return false;
  const officialDomains = [
    '.gov', '.nalog', '.gos', '.gov.', '.mil', '.fns',
    'bank', 'sberbank', 'vtb', 'alfabank', 'tinkoff',
    'court', 'arbitr', 'msud', 'sud'
  ];
  return officialDomains.some(domain => email.toLowerCase().includes(domain));
}

/**
 * Получение цвета для имени отправителя на основе ключевых слов (как в Mail.ru)
 */
export function getSenderNameColor(name: string, email: string): string {
  const n = (name || '').toLowerCase();
  const e = (email || '').toLowerCase();
  
  if (n.includes('гос') || n.includes('nalog') || n.includes('штраф') || n.includes('налог') || isOfficialEmail(e)) {
    return 'text-red-500 dark:text-red-400';
  }
  if (n.includes('рассылк') || n.includes('скидк') || n.includes('акци') || n.includes('sale') || n.includes('shop')) {
    return 'text-orange-500 dark:text-orange-400';
  }
  if (n.includes('социальн') || n.includes('facebook') || n.includes('vk') || n.includes('linkedin') || n.includes('instagram')) {
    return 'text-blue-500 dark:text-blue-400';
  }
  if (n.includes('чек') || n.includes('оплата') || n.includes('заказ')) {
    return 'text-emerald-500 dark:text-emerald-400';
  }
  
  return 'text-foreground';
}

/**
 * Генерация цвета для аватара на основе email
 */
export function getAvatarColor(email: string): string {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
    'bg-pink-500', 'bg-indigo-500', 'bg-orange-500',
    'bg-teal-500', 'bg-cyan-500', 'bg-rose-500'
  ];
  
  if (!email) {
    return colors[0]; // Default to blue if no email
  }
  
  const index = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

/**
 * Получение домена из email
 */
export function getDomainFromEmail(email: string): string {
  if (!email) return '';
  return email.split('@')[1] || '';
}

/**
 * Популярные домены и их логотипы (BIMI / Manual mapping)
 */
const BRAND_LOGOS: Record<string, string> = {
  'google.com': 'https://www.google.com/favicon.ico',
  'gmail.com': 'https://www.google.com/favicon.ico',
  'github.com': 'https://github.githubassets.com/favicons/favicon.svg',
  'microsoft.com': 'https://www.microsoft.com/favicon.ico',
  'outlook.com': 'https://www.microsoft.com/favicon.ico',
  'apple.com': 'https://www.apple.com/favicon.ico',
  'amazon.com': 'https://www.amazon.com/favicon.ico',
  'facebook.com': 'https://www.facebook.com/favicon.ico',
  'instagram.com': 'https://www.instagram.com/static/images/ico/favicon.ico/36b304827462.ico',
  'twitter.com': 'https://abs.twimg.com/favicons/twitter.2.ico',
  'x.com': 'https://abs.twimg.com/favicons/twitter.2.ico',
  'linkedin.com': 'https://static.licdn.com/sc/h/al2o9zrvru70srw09otge99sc',
  'vk.com': 'https://vk.com/favicon.ico',
  'yandex.ru': 'https://yastatic.net/iconhost/main/yandex/apple-touch-icon-180x180.png',
  'mail.ru': 'https://mail.ru/favicon.ico',
  'tinkoff.ru': 'https://www.tinkoff.ru/favicon.ico',
  'sberbank.ru': 'https://www.sberbank.ru/favicon.ico',
  'store77.net': 'https://store77.net/favicon.ico',
  'ozon.ru': 'https://www.ozon.ru/favicon.ico',
  'wildberries.ru': 'https://www.wildberries.ru/favicon.ico',
  'avito.ru': 'https://www.avito.ru/favicon.ico',
  'dns-shop.ru': 'https://www.dns-shop.ru/favicon.ico',
  'dns.ru': 'https://www.dns-shop.ru/favicon.ico',
  'mvideo.ru': 'https://www.mvideo.ru/favicon.ico',
  'eldorado.ru': 'https://www.eldorado.ru/favicon.ico',
  'gosuslugi.ru': 'https://www.gosuslugi.ru/favicon.ico',
  'nalog.ru': 'https://www.nalog.ru/favicon.ico',
  'moiraion.ru': 'https://moiraion.ru/favicon.ico',
  'rbc.ru': 'https://www.rbc.ru/favicon.ico',
  'kommersant.ru': 'https://www.kommersant.ru/favicon.ico',
  'vedomosti.ru': 'https://www.vedomosti.ru/favicon.ico',
  'zoom.us': 'https://zoom.us/favicon.ico',
  'slack.com': 'https://slack.com/favicon.ico',
  'telegram.org': 'https://telegram.org/favicon.ico',
  'whatsapp.com': 'https://www.whatsapp.com/favicon.ico',
};

/**
 * Получение URL логотипа отправителя
 */
export function getSenderLogoUrl(email: string, customAvatar?: string): string {
  if (customAvatar) return customAvatar;
  
  const domain = getDomainFromEmail(email).toLowerCase();
  if (!domain) return '';

  // 1. Проверяем наш список брендов
  if (BRAND_LOGOS[domain]) {
    return BRAND_LOGOS[domain];
  }

  // 2. Используем сервис Google Favicons как универсальный фолбэк ( Favicon сайта )
  // Мы используем sz=64 для лучшего качества
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

/**
 * Исправление mojibake (неправильной кодировки) в тексте
 */
export function fixMojibake(value: string): string {
  if (!value) return value;
  if (!/[ÐÑÃ]/.test(value)) return value;

  try {
    const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0));
    const decoded = new TextDecoder('utf-8').decode(bytes);
    return decoded.includes('\u0000') ? value : decoded;
  } catch {
    return value;
  }
}

/**
 * Определение системной папки по типу
 */
export const SYSTEM_FOLDER_TYPES = new Set(['system', 'inbox', 'sent', 'drafts', 'archive', 'spam', 'trash']);

export const isSystemFolder = (folderType?: string) => SYSTEM_FOLDER_TYPES.has((folderType || '').toLowerCase());

/**
 * Получение канонического ключа системной папки
 */
export const getCanonicalSystemKey = (folder: { folderName?: string; folderType?: string }) => {
  const type = (folder.folderType || '').toLowerCase();
  if (type && type !== 'system') return type;

  const name = (folder.folderName || '').toLowerCase();
  if (name === 'inbox' || name.includes('вход')) return 'inbox';
  if (name === 'sent mail' || name.includes('sent') || name.includes('отправ')) return 'sent';
  if (name === 'drafts' || name.includes('чернов')) return 'drafts';
  if (name === 'archive' || name.includes('архив')) return 'archive';
  if (name === 'spam' || name.includes('спам')) return 'spam';
  if (name === 'trash' || name.includes('корзин')) return 'trash';

  return `${type}:${name}`;
};

/**
 * Очистка HTML от скриптов и опасных атрибутов
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  return html
    // Удаляем теги <script> и их содержимое
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Удаляем инлайновые обработчики событий (onclick, onload и т.д.)
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    // Добавляем target="_blank" ко всем ссылкам
    .replace(/<a\b([^>]*)/gi, (match, p1) => {
      if (p1.includes('target=')) return match;
      return `<a target="_blank" rel="noopener noreferrer"${p1}`;
    });
}

/**
 * Форматирование размера файла
 */
export function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Названия системных папок на русском
 */
export const systemFolderNames: Record<string, string> = {
  inbox: 'Входящие',
  sent: 'Отправленные',
  drafts: 'Черновики',
  archive: 'Архив',
  spam: 'Спам',
  trash: 'Корзина',
  Inbox: 'Входящие',
  'Sent Mail': 'Отправленные',
  Drafts: 'Черновики',
  Archive: 'Архив',
  Spam: 'Спам',
  Trash: 'Корзина',
};