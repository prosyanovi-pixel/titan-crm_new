import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Форматирование валюты
 */
export function formatCurrency(value: number | string | undefined | null, currency = 'RUB'): string {
  if (value === undefined || value === null) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';

  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Алиас для formatCurrency с рублем по умолчанию
 */
export const formatMoney = (value: number | string | undefined | null) => formatCurrency(value, 'RUB');

/**
 * Форматирование даты
 */
export function formatDate(date: string | Date | undefined | null, pattern = 'dd.MM.yyyy'): string {
  if (!date) return '—';
  try {
    // Если это строка в формате dd.MM.yyyy, пробуем распарсить её правильно
    if (typeof date === 'string' && /^\d{2}\.\d{2}\.\d{4}$/.test(date)) {
      const [day, month, year] = date.split('.');
      const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(d.getTime())) {
        return format(d, pattern === 'dd.MM.yyyy' ? 'dd.MM.yyyy' : pattern, { locale: ru });
      }
    }
    
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '—';
    return format(d, pattern, { locale: ru });
  } catch {
    return '—';
  }
}

/**
 * Форматирование даты и времени
 */
export function formatDateTime(date: string | Date | undefined | null): string {
  return formatDate(date, 'dd.MM.yyyy HH:mm');
}

/**
 * Форматирование чисел
 */
export function formatNumber(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return '—';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '—';

  return new Intl.NumberFormat('ru-RU').format(num);
}

/**
 * Форматирование размера файла
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
