/**
 * Роутер для доступа к документам: скачивание, версии и шаринг
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../../../utils/errorHandler');
const { sendSuccess, sendNotFound, sendValidationError } = require('../../../utils/responseHelpers');
const db = require('../../../db');
const logger = require('../../../utils/logger');
const checkPermission = require('../../../middleware/checkPermission');
const storageService = require('../services/storageService');

async function downloadFile(req, res) {
  const { id } = req.params;
  const { rows } = await db.query('SELECT * FROM documents WHERE id = $1', [id]);

  if (rows.length === 0) {
    return sendNotFound(res, 'Файл не найден.');
  }

  const file = rows[0];

  if (file.type === 'folder') {
    return sendValidationError(res, 'Невозможно скачать папку.');
  }

  const storedFilename = file.stored_filename || file.storedFilename;
  const exists = await storageService.fileExists(storedFilename);

  if (!exists) {
    return sendNotFound(res, 'Файл не найден на сервере.');
  }

  const fileStream = await storageService.getFileStream(storedFilename);
  const encodedFilename = encodeURIComponent(file.name);
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
  res.setHeader('Content-Type', 'application/octet-stream');

  fileStream.pipe(res);
  fileStream.on('error', () => {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Ошибка при скачивании файла' });
    }
  });
}

async function shareFile(req, res) {
  const { id } = req.params;
  const { rows } = await db.query('SELECT * FROM documents WHERE id = $1', [id]);

  if (rows.length === 0) {
    return sendNotFound(res, 'Файл не найден.');
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    logger.error('[documents] API_URL environment variable is not set');
    return res.status(500).json({ error: 'Ошибка конфигурации сервера.' });
  }

  const shareUrl = `${apiUrl}/api/documents/download/${id}`;
  sendSuccess(res, { shareUrl });
}

async function getVersions(req, res) {
  const { id } = req.params;

  const { rows } = await db.query(
    `SELECT v.*, u.name as creator_name 
     FROM document_versions v
     LEFT JOIN users u ON v.created_by = u.id
     WHERE v.document_id = $1
     ORDER BY v.version_number DESC`,
    [id]
  );

  sendSuccess(res, rows);
}

async function downloadVersion(req, res) {
  const { versionId } = req.params;

  const { rows } = await db.query(
    `SELECT v.*, d.name as original_name 
     FROM document_versions v
     JOIN documents d ON v.document_id = d.id
     WHERE v.id = $1`,
    [versionId]
  );

  if (rows.length === 0) {
    return sendNotFound(res, 'Версия не найдена.');
  }

  const version = rows[0];
  const exists = await storageService.fileExists(version.stored_filename);

  if (!exists) {
    return res.status(404).json({ error: 'Файл версии не найден в хранилище.' });
  }

  const fileStream = await storageService.getFileStream(version.stored_filename);
  const encodedFilename = encodeURIComponent(`${version.original_name} (v${version.version_number})`);

  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
  res.setHeader('Content-Type', 'application/octet-stream');

  fileStream.pipe(res);
}

router.get('/download/:id', checkPermission('documents.read'), asyncHandler(downloadFile));
router.get('/:id/versions', checkPermission('documents.read'), asyncHandler(getVersions));
router.get('/version/:versionId/download', checkPermission('documents.read'), asyncHandler(downloadVersion));
router.get('/share/:id', checkPermission('documents.read'), asyncHandler(shareFile));

module.exports = router;
