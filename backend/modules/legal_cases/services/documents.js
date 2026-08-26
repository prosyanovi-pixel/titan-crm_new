/**
 * Сервис для управления документами юридических дел
 * Бизнес-логика: загрузка, хранение, удаление файлов
 */

const db = require('../../../db');
const logger = require('../../../utils/logger');
const path = require('path');
const fs = require('fs');

/**
 * Получить документы по ID дела
 * @param {string} caseId - ID дела
 * @param {string} [instanceId] - ID инстанции (опционально)
 * @returns {Promise<Array>} Список документов
 */
async function getDocumentsByCaseId(caseId, instanceId = null) {
  let query = `SELECT * FROM case_documents WHERE case_id = $1`;
  const params = [caseId];

  if (instanceId) {
    query += ` AND instance_id = $2`;
    params.push(instanceId);
  }

  query += ` ORDER BY date DESC`;
  
  const { rows } = await db.query(query, params);
  return rows;
}

/**
 * Создать запись о документе в БД
 * @param {Object} docData - Данные документа
 * @returns {Promise<Object>} Созданная запись
 */
async function createDocumentRecord(docData) {
  const { rows } = await db.query(
    `INSERT INTO case_documents (
       id, case_id, instance_id, name, type, date, size, author, url
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      docData.id,
      docData.case_id,
      docData.instance_id || docData.instanceId || null,
      docData.name,
      docData.type,
      docData.date,
      docData.size,
      docData.author,
      docData.url,
    ]
  );
  return rows[0];
}

/**
 * Получить документ по ID
 * @param {string} id - ID документа
 * @returns {Promise<Object|null>} Запись о документе
 */
async function getDocumentById(id) {
  const { rows } = await db.query(
    `SELECT url FROM case_documents WHERE id = $1`,
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Удалить документ из БД
 * @param {string} id - ID документа
 * @returns {Promise<void>}
 */
async function deleteDocumentRecord(id) {
  await db.query(`DELETE FROM case_documents WHERE id = $1`, [id]);
}

/**
 * Удалить физический файл с диска
 * @param {string} filePath - Путь к файлу
 * @returns {Promise<boolean>} Успешность удаления
 */
async function deletePhysicalFile(filePath) {
  return new Promise((resolve) => {
    if (!fs.existsSync(filePath)) {
      resolve(false);
      return;
    }

    fs.unlink(filePath, (err) => {
      if (err) {
        logger.error('Failed to delete file', { path: filePath, error: err.message });
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * Получить неиспользуемые документы для очистки
 * @param {string[]} fileIds - Список ID файлов
 * @returns {Promise<Array>} Документы без case_id
 */
async function getUnusedDocuments(fileIds) {
  const placeholders = fileIds.map((_, i) => `$${i + 1}`).join(',');
  const { rows } = await db.query(
    `SELECT id, url FROM case_documents
     WHERE id IN (${placeholders}) AND case_id IS NULL`,
    fileIds
  );
  return rows;
}

/**
 * Очистить неиспользуемые документы
 * @param {string[]} fileIds - Список ID файлов для очистки
 * @returns {Promise<number>} Количество удалённых документов
 */
async function cleanupUnusedDocuments(fileIds) {
  const unusedDocs = await getUnusedDocuments(fileIds);
  let deletedCount = 0;

  for (const doc of unusedDocs) {
    if (doc.url) {
      const filename = doc.url.split('/').pop();
      const filePath = path.join(__dirname, '../../../uploads/legal-cases', filename);
      await deletePhysicalFile(filePath);
    }

    await deleteDocumentRecord(doc.id);
    deletedCount++;
  }

  return deletedCount;
}

/**
 * Форматировать размер файла
 * @param {number} bytes - Размер в байтах
 * @returns {string} Форматированный размер
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Декодировать имя файла из UTF-8
 * @param {string} originalName - Исходное имя файла
 * @returns {string} Декодированное имя
 */
function decodeFilename(originalName) {
  let decodedName = originalName;
  try {
    if (/[\u0080-\u00FF]/.test(originalName)) {
      decodedName = Buffer.from(originalName, 'latin1').toString('utf-8');
    }
  } catch (e) {
    decodedName = originalName;
  }
  return decodedName;
}

module.exports = {
  getDocumentsByCaseId,
  createDocumentRecord,
  getDocumentById,
  deleteDocumentRecord,
  deletePhysicalFile,
  getUnusedDocuments,
  cleanupUnusedDocuments,
  formatFileSize,
  decodeFilename,
};
