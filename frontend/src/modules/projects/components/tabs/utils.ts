import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export const formatDate = (dateStr?: string, showYear: boolean = true) => {
  if (!dateStr) return '—';
  try {
    const [day, month, year] = dateStr.split('.');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return format(date, showYear ? 'dd MMM yyyy' : 'dd.MM.yyyy', { locale: ru });
  } catch {
    return dateStr;
  }
};

export const formatMoney = (amount?: number | string | null) => {
  if (amount === undefined || amount === null) return '—';
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(val)) return '—';
  
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(val);
};
