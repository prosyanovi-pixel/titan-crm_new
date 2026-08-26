/**
 * Утилиты для работы с датами
 */

/**
 * Форматирует дату из ISO в DD.MM.YYYY для frontend
 * @param {string|Date|null} date - Дата в формате ISO или объект Date
 * @returns {string|null} - Дата в формате DD.MM.YYYY или null
 */
const formatDate = (date) => {
  if (!date) return null;
  
  try {
    const d = new Date(date);
    
    // Проверка на валидность даты
    if (isNaN(d.getTime())) {
      return null;
    }
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}.${month}.${year}`;
  } catch (error) {
    return null;
  }
};

/**
 * Парсит дату из DD.MM.YYYY в ISO формат для базы данных
 * @param {string|null} date - Дата в формате DD.MM.YYYY или ISO
 * @returns {string|null} - Дата в формате ISO или null
 */
const parseDate = (date) => {
  if (!date) return null;
  
  try {
    // Проверяем, если уже в ISO формате
    if (date.includes('T') || (date.includes('-') && date.split('-').length === 3)) {
      return date;
    }
    
    // Парсим DD.MM.YYYY
    const parts = date.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed in JS
      const year = parseInt(parts[2], 10);
      
      const d = new Date(year, month, day);
      
      // Проверка на валидность даты
      if (isNaN(d.getTime())) {
        return null;
      }
      
      return d.toISOString();
    }
    
    return date;
  } catch (error) {
    return null;
  }
};

/**
 * Форматирует дату и время в читаемый формат
 * @param {string|Date|null} date - Дата в формате ISO или объект Date
 * @returns {string|null} - Дата в формате DD.MM.YYYY HH:MM или null
 */
const formatDateTime = (date) => {
  if (!date) return null;
  
  try {
    const d = new Date(date);
    
    if (isNaN(d.getTime())) {
      return null;
    }
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  } catch (error) {
    return null;
  }
};

/**
 * Проверяет, является ли дата валидной
 * @param {string|Date} date - Дата для проверки
 * @returns {boolean} - true если дата валидна
 */
const isValidDate = (date) => {
  if (!date) return false;
  
  try {
    const d = new Date(date);
    return !isNaN(d.getTime());
  } catch (error) {
    return false;
  }
};

/**
 * Получает текущую дату в ISO формате
 * @returns {string} - Текущая дата в ISO формате
 */
const getCurrentDate = () => {
  return new Date().toISOString();
};

/**
 * Добавляет дни к дате
 * @param {string|Date} date - Исходная дата
 * @param {number} days - Количество дней для добавления
 * @returns {string} - Новая дата в ISO формате
 */
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

/**
 * Вычисляет разницу в днях между двумя датами
 * @param {string|Date} date1 - Первая дата
 * @param {string|Date} date2 - Вторая дата
 * @returns {number} - Разница в днях
 */
const getDaysDifference = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

module.exports = {
  formatDate,
  parseDate,
  formatDateTime,
  isValidDate,
  getCurrentDate,
  addDays,
  getDaysDifference
};
