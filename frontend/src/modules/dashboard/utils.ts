/**
 * Разбор даты из различных форматов
 */
export function parseDeadline(str: string | undefined): Date | null {
  if (!str) return null;
  const parts = str.split(/[./-]/);
  if (parts.length >= 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    const dt = new Date(y, m, d);
    if (!isNaN(dt.getTime())) return dt;
  }
  const d1 = new Date(str);
  return isNaN(d1.getTime()) ? null : d1;
}

/**
 * Определение статуса дедлайна
 */
export function getDeadlineStatus(dateStr: string | undefined): 'overdue' | 'today' | 'tomorrow' | 'upcoming' | null {
  const d = parseDeadline(dateStr);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  return 'upcoming';
}
