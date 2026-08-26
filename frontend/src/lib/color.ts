/**
 * Color Utilities — набор функций для работы с цветом
 * 
 * @example
 * ```tsx
 * import { getContrastColor, withAlpha, generateColorFromString } from '@/lib/color';
 * 
 * const color = generateColorFromString('My Tag');
 * const contrastColor = getContrastColor(color);
 * const semiTransparent = withAlpha(color, 0.2);
 * ```
 */

/**
 * Вычисляет контрастный цвет текста для заданного фона
 * 
 * @param hexColor HEX цвет (#RRGGBB)
 * @returns '#1f2937' для светлого фона, 'white' для тёмного
 * 
 * @example
 * getContrastColor('#ffffff') // '#1f2937' (чёрный текст)
 * getContrastColor('#000000') // 'white' (белый текст)
 */
export function getContrastColor(hexColor: string): string {
  if (!hexColor?.startsWith('#')) return 'white';

  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);

  // Формула яркости: (R*299 + G*587 + B*114) / 1000
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // Если фон светлый (яркость > 128), используем чёрный текст, иначе белый
  return brightness > 128 ? '#1f2937' : 'white';
}

/**
 * Добавляет alpha-канал к HEX цвету
 * 
 * @param hex HEX цвет (#RRGGBB)
 * @param alpha Прозрачность от 0 до 1
 * @returns RGBA строка
 * 
 * @example
 * withAlpha('#3b82f6', 0.2) // 'rgba(59, 130, 246, 0.2)'
 */
export function withAlpha(hex: string, alpha: number): string {
  if (!hex.startsWith('#')) return hex;
  
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Палитра приятных цветов (Tailwind 500)
 */
export const COLOR_PALETTE = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#84cc16', // lime-500
  '#06b6d4', // cyan-500
  '#6366f1', // indigo-500
  '#a855f7', // purple-500
  '#d946ef', // fuchsia-500
  '#0ea5e9', // sky-500
  '#22c55e', // green-500
  '#eab308', // yellow-500
] as const;

export type ColorPalette = typeof COLOR_PALETTE[number];

/**
 * Генерация цвета из строки с использованием хэша
 * 
 * @param str Входная строка
 * @returns HEX цвет из палитры
 * 
 * @example
 * generateColorFromString('My Tag') // '#3b82f6'
 */
export function generateColorFromString(str: string): ColorPalette {
  // Простой хэш строки
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  const index = hash % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

/**
 * Получить цвет для тега на основе его названия или настроек
 * 
 * @param tagName Название тега
 * @param tagSettings Массив настроек тегов с цветами
 * @returns HEX цвет
 * 
 * @example
 * getTagColor('VIP', [{ name: 'VIP', color: '#8b5cf6' }]) // '#8b5cf6'
 */
export function getTagColor(
  tagName: string, 
  tagSettings?: Array<{ name: string; color?: string }>
): ColorPalette {
  if (tagSettings) {
    const found = tagSettings.find(t => t.name === tagName);
    if (found?.color) {
      return found.color as ColorPalette;
    }
  }
  return generateColorFromString(tagName);
}

/**
 * Конвертирует HEX в RGB
 * 
 * @param hex HEX цвет (#RRGGBB)
 * @returns Объект { r, g, b }
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Конвертирует RGB в HEX
 * 
 * @param r Красный (0-255)
 * @param g Зелёный (0-255)
 * @param b Синий (0-255)
 * @returns HEX цвет (#RRGGBB)
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Осветляет или затемняет цвет
 * 
 * @param hex HEX цвет (#RRGGBB)
 * @param percent Процент осветления (>0) или затемнения (<0)
 * @returns HEX цвет
 * 
 * @example
 * lighten('#3b82f6', 20) // более светлый синий
 * lighten('#3b82f6', -20) // более тёмный синий
 */
export function lighten(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex);
  const factor = percent / 100;
  
  const newR = Math.round(r + (255 - r) * factor);
  const newG = Math.round(g + (255 - g) * factor);
  const newB = Math.round(b + (255 - b) * factor);
  
  return rgbToHex(newR, newG, newB);
}

/**
 * Проверяет, является ли цвет светлым
 * 
 * @param hex HEX цвет (#RRGGBB)
 * @returns true если цвет светлый
 */
export function isLightColor(hex: string): boolean {
  return getContrastColor(hex) === '#1f2937';
}
