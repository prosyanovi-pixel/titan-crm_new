import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Преобразует строку rowsPerPage в число строк на странице.
 *  "all" → Infinity (slice вернёт все элементы, totalPages = 1)
 *  иначе → parseInt или fallback 25
 */
export function parseRowsPerPage(value: string): number {
  if (value === 'all') return Infinity;
  return parseInt(value) || 25;
}

/** Форматирует сумму в рублях */
export function formatMoney(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Форматирует размер в байтах в человекочитаемый вид (KB, MB, GB и т.д.) */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
