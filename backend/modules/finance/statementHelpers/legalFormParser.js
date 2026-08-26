/**
 * Парсинг правовых форм и названий контрагентов
 * Файл: routes/finance/statementHelpers/legalFormParser.js
 */

/**
 * Извлекает правовую форму из полного названия
 * @param {string} name - Полное название организации
 * @returns {string|null} - Код правовой формы или null
 */
const extractLegalForm = (name) => {
  if (!name) return null;
  const n = name.toUpperCase();
  
  if (/\bИП\b/.test(n) || n.startsWith('ИП ') || n.startsWith('ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ')) {
    return 'ip';
  }
  
  if (/\bООО\b|\bОАО\b|\bЗАО\b|\bАО\b|\bПАО\b/.test(n)) {
    return 'ooo';
  }
  
  if (n.includes('ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ')) {
    return 'ooo';
  }
  
  if (n.includes('АКЦИОНЕРНОЕ ОБЩЕСТВО')) {
    return 'ooo';
  }
  
  if (/САМОЗАНЯТЫЙ|САМОЗАНЯТАЯ/.test(n)) {
    return 'self';
  }
  
  if (n.startsWith('ФГУП') || n.startsWith('МУП') || n.startsWith('ГБОУ') ||
      n.startsWith('ГБУЗ') || n.startsWith('ФГБУ')) {
    return 'ooo';
  }
  
  return null;
};

/**
 * Убирает расшифровку правовой формы из названия
 * @param {string} name - Полное название
 * @returns {string} - Краткое название
 */
const shortName = (name) => {
  if (!name) return name;
  
  return name
    .replace(/^ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ\s*/i, 'ООО ')
    .replace(/^АКЦИОНЕРНОЕ ОБЩЕСТВО\s*/i, 'АО ')
    .replace(/^ПУБЛИЧНОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО\s*/i, 'ПАО ')
    .replace(/^ОТКРЫТОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО\s*/i, 'ОАО ')
    .replace(/^ЗАКРЫТОЕ АКЦИОНЕРНОЕ ОБЩЕСТВО\s*/i, 'ЗАО ')
    .replace(/^ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ\s*/i, 'ИП ')
    .trim();
};

/**
 * Определяет тип контрагента по правовой форме и длине ИНН
 * @param {string|null} legalForm - Правовая форма
 * @param {string|null} inn - ИНН
 * @returns {string} - 'individual' или 'company'
 */
const detectType = (legalForm, inn) => {
  if (legalForm === 'ip' || legalForm === 'self') {
    return 'individual';
  }
  
  if (inn && inn.replace(/\D/g, '').length === 12) {
    return 'individual';
  }
  
  return 'company';
};

module.exports = {
  extractLegalForm,
  shortName,
  detectType,
};
