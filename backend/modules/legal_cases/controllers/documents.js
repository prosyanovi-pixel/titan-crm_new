/**
 * Контроллер для управления документами юридических дел
 * Обработчики HTTP-запросов
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../../../utils/errorHandler');
const { sendSuccess, sendCreated, sendNotFound } = require('../../../utils/responseHelpers');
const upload = require('../config/upload');
const fs = require('fs');
const { randomUUID } = require('crypto');
const {
  getDocumentsByCaseId,
  createDocumentRecord,
  getDocumentById,
  deleteDocumentRecord,
  deletePhysicalFile,
  cleanupUnusedDocuments,
  formatFileSize,
  decodeFilename,
} = require('../services/documents');
const { addCaseEvent } = require('../services/cases');
const logger = require('../../../utils/logger');
const path = require('path');

/**
 * Получить документы по ID дела
 * @route GET /api/legal-cases/documents/case/:caseId
 */
async function getDocumentsByCaseIdHandler(req, res) {
  const { caseId } = req.params;
  const { instance_id } = req.query;

  if (!caseId) {
    return res.status(400).json({ error: 'Case ID is required' });
  }

  const documents = await getDocumentsByCaseId(caseId, instance_id);
  sendSuccess(res, documents);
}

/**
 * Загрузить документ
 * @route POST /api/legal-cases/documents
 */
async function uploadDocumentHandler(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }

  const { name, type, case_id, instance_id } = req.body;
  const userName = req.headers['x-user-name']
    ? decodeURIComponent(req.headers['x-user-name'])
    : 'User';

  logger.debug('Uploading document', { case_id, instance_id, name, type, userName });

  // Декодируем имя файла
  const decodedName = decodeFilename(req.file.originalname);

  // Создаём запись в БД
  const doc = await createDocumentRecord({
    id: `doc-${randomUUID()}`,
    case_id: case_id || null,
    instance_id: instance_id || null,
    name: name || decodedName,
    type: type || 'other',
    date: new Date().toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    size: formatFileSize(req.file.size),
    author: userName,
    url: '/api/legal-cases/documents/files/' + req.file.filename,
  });

  logger.debug('Document inserted', {
    id: doc.id,
    case_id: doc.case_id,
    name: doc.name,
    url: doc.url,
  });

  // Создаем событие в Таймлайне
  if (case_id) {
    try {
      await addCaseEvent(case_id, {
        title: 'Добавлен документ',
        description: `Загружен новый файл: ${name || decodedName}`,
        type: 'document',
        author: userName,
        instance_id: instance_id || null
      });
    } catch (err) {
      logger.warn('Failed to create timeline event for document upload', err);
    }
  }

  sendCreated(res, {
    id: doc.id,
    name: doc.name,
    type: doc.type,
    url: doc.url,
    size: doc.size,
    filename: req.file.filename,
    author: userName,
    date: doc.date,
  });
}

/**
 * Получить файл
 * @route GET /api/legal-cases/documents/files/:filename
 */
async function getFileHandler(req, res) {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../../uploads/legal-cases', filename);

  if (!fs.existsSync(filePath)) {
    return sendNotFound(res, 'Файл не найден');
  }

  res.sendFile(filePath);
}

/**
 * Удалить документ
 * @route DELETE /api/legal-cases/documents/:id
 */
async function deleteDocumentHandler(req, res) {
  const { id } = req.params;

  // Получаем информацию о документе
  const doc = await getDocumentById(id);

  if (!doc) {
    return sendNotFound(res, 'Документ не найден');
  }

  // Удаляем файл с диска
  if (doc.url) {
    const filename = doc.url.split('/').pop();
    const filePath = path.join(__dirname, '../../../uploads/legal-cases', filename);
    await deletePhysicalFile(filePath);
  }

  // Удаляем запись из БД
  await deleteDocumentRecord(id);

  sendSuccess(res, { success: true, message: 'Document deleted' });
}

/**
 * Очистка неиспользуемых файлов
 * @route POST /api/legal-cases/documents/cleanup
 */
async function cleanupDocumentsHandler(req, res) {
  const { fileIds } = req.body;

  if (!fileIds || !Array.isArray(fileIds)) {
    return res.status(400).json({ error: 'Необходимо передать fileIds' });
  }

  const deletedCount = await cleanupUnusedDocuments(fileIds);
  sendSuccess(res, { success: true, deleted: deletedCount });
}

// Маршруты
router.get('/case/:caseId', asyncHandler(getDocumentsByCaseIdHandler));
router.post('/', upload.single('file'), asyncHandler(uploadDocumentHandler));
router.get('/files/:filename', asyncHandler(getFileHandler));
router.delete('/:id', asyncHandler(deleteDocumentHandler));
router.post('/cleanup', asyncHandler(cleanupDocumentsHandler));

module.exports = router;
