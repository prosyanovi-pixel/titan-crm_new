const db = require('../../../db');

/**
 * Исправление кодировки имен файлов (UTF-8 интерпретируется как Latin-1)
 * @param {string} str - Исходная строка
 * @returns {string} Исправленная строка
 */
function fixEncoding(str) {
  if (!str) return str;

  try {
    const bytes = Buffer.from(str, 'utf-8');
    const hasUtf8Pattern = /[\xD0-\xD2]/.test(str);

    if (hasUtf8Pattern) {
      logger.debug('[encoding] Detected UTF-8 bytes in latin1 string');
      const fixed = Buffer.from(str, 'latin1').toString('utf8');
      logger.debug('[encoding] Fixed result:', fixed);

      if (!/[À-ÿ]/.test(fixed)) {
        return fixed;
      }
    }
  } catch (e) {
    logger.warn(`[encoding] Error in fixEncoding:`, e.message);
  }

  return str;
}

/**
 * Форматирование размера файла
 * @param {number} bytes - Размер в байтах
 * @returns {string} Отформатированный размер
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Получить или создать папку в таблице documents
 * @param {string} folderName - Название папки
 * @param {string} [parentId] - ID родительской папки
 * @returns {Promise<string>} ID папки
 */
async function getOrCreateFolder(folderName, parentId = null) {
  const query = parentId 
    ? 'SELECT id FROM documents WHERE name = $1 AND type = \'folder\' AND parent_id = $2 LIMIT 1'
    : 'SELECT id FROM documents WHERE name = $1 AND type = \'folder\' AND parent_id IS NULL LIMIT 1';
  
  const params = parentId ? [folderName, parentId] : [folderName];
  const { rows } = await db.query(query, params);

  if (rows.length > 0) {
    return rows[0].id;
  }

  const folderId = `folder-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const now = new Date().toISOString().split('T')[0];

  await db.query(
    `INSERT INTO documents (id, name, type, parent_id, date)
     VALUES ($1, $2, $3, $4, $5)`,
    [folderId, folderName, 'folder', parentId, now]
  );

  return folderId;
}

/**
 * Парсинг строки размера файла в байты
 * @param {string|number} sizeStr - Строка размера (например, '2.5 MB' или '450 KB')
 * @returns {number} Размер в байтах
 */
function parseSizeToBytes(sizeStr) {
  if (sizeStr === null || sizeStr === undefined || sizeStr === '') return 0;
  if (typeof sizeStr === 'number') return sizeStr;

  const cleanStr = String(sizeStr).trim().toUpperCase();
  if (!cleanStr) return 0;

  // Регулярное выражение для поиска числа и единицы измерения
  const match = cleanStr.match(/^(\d+(?:\.\d+)?)\s*([KMGT]B|B)?$/);
  
  if (!match) {
    // Если формат не распознан, пробуем просто извлечь цифры
    const numeric = parseInt(cleanStr.replace(/[^0-9]/g, ''));
    return isNaN(numeric) ? 0 : numeric;
  }

  const value = parseFloat(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'TB': return value * 1024 * 1024 * 1024 * 1024;
    case 'GB': return value * 1024 * 1024 * 1024;
    case 'MB': return value * 1024 * 1024;
    case 'KB': return value * 1024;
    case 'B': return value;
    default: return value; // По умолчанию считаем байтами если нет единицы
  }
}

module.exports = {
  fixEncoding,
  formatFileSize,
  getOrCreateFolder,
  parseSizeToBytes,
};
