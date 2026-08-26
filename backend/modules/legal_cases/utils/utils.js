/**
 * Утилиты для модуля Legal Cases
 * Базовые вспомогательные функции
 */

/**
 * Возвращает первое определённое значение из списка
 * @param  {...any} values - Список значений
 * @returns {any} Первое определённое значение
 */
const pickFirstDefined = (...values) =>
  values.find((v) => v !== undefined && v !== null);

/**
 * Преобразует значение в число
 * @param {any} value - Значение
 * @param {number} fallback - Значение по умолчанию
 * @returns {number} Число или fallback
 */
const toNumber = (value, fallback = 0) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Очищает текстовое значение
 * @param {any} value - Значение
 * @returns {string|null} Очищенное значение или null
 */
const cleanTextValue = (value) => (value === undefined ? null : value);

/**
 * Очищает числовое значение
 * @param {any} value - Значение
 * @param {number} fallback - Значение по умолчанию
 * @returns {number} Очищенное число
 */
const cleanNumberValue = (value, fallback = 0) => {
  if (value === undefined || value === null) return fallback;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Генерирует уникальный суффикс для временных ID
 * @returns {string} Уникальный суффикс
 */
const randSuffix = () =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

module.exports = {
  pickFirstDefined,
  toNumber,
  cleanTextValue,
  cleanNumberValue,
  randSuffix,
};
