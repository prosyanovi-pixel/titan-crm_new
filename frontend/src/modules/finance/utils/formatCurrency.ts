/**
 * Форматирование валюты для отображения
 * 
 * @param amount - Сумма для форматирования
 * @param currency - Валюта (по умолчанию RUB)
 * @returns Отформатированная строка (например: "308 334,00 ₽")
 */
export function formatCurrency(amount: number, currency: string = 'RUB'): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Форматирование суммы без символа валюты
 * 
 * @param amount - Сумма для форматирования
 * @returns Отформатированная строка (например: "308 334,00")
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
