/**
 * Контроллер для управления документами
 * Включает загрузку, скачивание, удаление и работу с папками
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { asyncHandler } = require('../../../utils/errorHandler');
const { sendSuccess, sendCreated, sendNotFound, sendValidationError } = require('../../../utils/responseHelpers');
const { logAction } = require('../../../utils/auditLogger');
const db = require('../../../db');
const logger = require('../../../utils/logger');
const { fixEncoding, parseSizeToBytes } = require('../utils/helpers');
const { authMiddleware } = require('../../../middleware/auth');
const checkPermission = require('../../../middleware/checkPermission');
const storageService = require('../services/storageService');
const documentAccessRouter = require('./documentsAccess');
const { removeDocumentsPermanentlyByIds } = require('./documentsCleanup');

async function extractTextFromFile(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  try {
    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } else if (ext === '.docx') {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }
  } catch (err) {
    logger.warn(`Failed to extract text from ${originalName}:`, err.message);
  }
  return '';
}

// Настройка хранилища для multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '../../../uploads/temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomUUID();
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Проверка типов файлов
const fileFilter = (req, file, cb) => {
  logger.debug('[multer] File received:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });
  cb(null, true);
};

// Инициализация multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB максимум
  }
});

/**
 * Получить все документы
 * @route GET /api/documents/
 */
async function getAll(req, res) {
  const { parentId, filter, search } = req.query;
  
  let query = 'SELECT * FROM documents';
  const params = [];

  if (search) {
    // Поиск по имени ИЛИ по содержимому (если оно извлечено)
    query = `
      SELECT * FROM documents 
      WHERE deleted_at IS NULL AND (
        name ILIKE $1 OR 
        content_text ILIKE $1
      )
      ORDER BY type DESC, name ASC
    `;
    params.push(`%${search}%`);
  } else if (filter === 'trash') {
    query = 'SELECT * FROM documents WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC';
  } else {
    query = 'SELECT * FROM documents WHERE deleted_at IS NULL';
    if (parentId === 'root' || !parentId) {
      query += ' AND parent_id IS NULL';
    } else {
      query += ' AND parent_id = $1';
      params.push(parentId);
    }
    query += ' ORDER BY type DESC, name ASC';
  }
  
  const { rows } = await db.query(query, params);

  // Добавляем проверку физического существования для файлов
  const enrichedRows = await Promise.all(rows.map(async (doc) => {
    if (doc.type === 'folder') return doc;
    
    const storedFilename = doc.stored_filename || doc.storedFilename;
    const exists = await storageService.fileExists(storedFilename || (doc.id + path.extname(doc.name)));
    
    return {
      ...doc,
      isMissing: !exists
    };
  }));

  sendSuccess(res, enrichedRows);
}

/**
 * Восстановить документы из корзины
 * @route POST /api/documents/restore
 */
async function restoreDocuments(req, res) {
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return sendValidationError(res, 'Не указаны ID для восстановления.');
  }

  const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');

  await db.query(
    `WITH RECURSIVE descendants AS (
       SELECT id FROM documents WHERE id IN (${placeholders})
       UNION
       SELECT d.id
       FROM documents d
       INNER JOIN descendants parent_docs ON d.parent_id = parent_docs.id
     )
     UPDATE documents
     SET deleted_at = NULL
     WHERE id IN (SELECT id FROM descendants)`,
    ids
  );

  sendSuccess(res, { message: 'Файлы восстановлены' });
}

/**
 * Получить путь к папке (Breadcrumbs)
 * @route GET /api/documents/path/:id
 */
async function getFolderPath(req, res) {
  const { id } = req.params;

  if (id === 'root' || !id) {
    return sendSuccess(res, []);
  }

  try {
    const { rows } = await db.query(
      `WITH RECURSIVE folder_path AS (
        SELECT id, name, parent_id, 0 as level
        FROM documents
        WHERE id = $1
        UNION ALL
        SELECT d.id, d.name, d.parent_id, fp.level + 1
        FROM documents d
        JOIN folder_path fp ON d.id = fp.parent_id
      )
      SELECT id, name FROM folder_path ORDER BY level DESC`,
      [id]
    );

    sendSuccess(res, rows);
  } catch (error) {
    logger.error('Error fetching folder path:', error);
    res.status(500).json({ error: 'Failed to fetch folder path' });
  }
}

/**
 * Получить статистику документов
 * @route GET /api/documents/stats
 */
async function getStats(req, res) {
  try {
    const { rows } = await db.query(
      "SELECT type, size FROM documents WHERE type != 'folder' AND deleted_at IS NULL"
    );

    let filesCount = 0;
    let totalSizeBytes = 0;
    const categories = {
      documents: 0,
      images: 0,
      others: 0
    };

    rows.forEach(row => {
      filesCount++;
      const sizeBytes = parseSizeToBytes(row.size);
      totalSizeBytes += sizeBytes;

      const type = (row.type || '').toLowerCase();
      if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'rtf'].includes(type)) {
        categories.documents += sizeBytes;
      } else if (['image', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(type)) {
        categories.images += sizeBytes;
      } else {
        categories.others += sizeBytes;
      }
    });

    const usedValueGB = totalSizeBytes / (1024 * 1024 * 1024);
    const totalGB = 50;
    const percentage = Math.min(100, Math.round((usedValueGB / totalGB) * 100));

    sendSuccess(res, {
      used: totalSizeBytes,
      total: totalGB * 1024 * 1024 * 1024,
      percentage: percentage,
      filesCount: filesCount,
      categories: {
        documents: categories.documents,
        images: categories.images,
        others: categories.others
      }
    });
  } catch (error) {
    logger.error('Error fetching document stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}
/**
 * Создать папку
 * @route POST /api/documents/folder
 */
async function createFolder(req, res) {
  const { name, parentId } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return sendValidationError(res, 'Название папки обязательно и не должно быть пустым.');
  }

  const folderId = `folder-${Date.now()}`;
  const now = new Date().toISOString().split('T')[0];

  const { rows } = await db.query(
    `INSERT INTO documents (id, name, type, parent_id, date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [folderId, name.trim(), 'folder', parentId, now]
  );

  await logAction({
    userId: req.user?.id,
    action: 'CREATE',
    entityType: 'document_folder',
    entityId: folderId,
    newData: rows[0],
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  sendCreated(res, rows[0]);
}

/**
 * Загрузить файл
 * @route POST /api/documents/upload
 */
async function uploadFile(req, res) {
  try {
    if (!req.file) {
      return sendValidationError(res, 'Файл не был загружен. Проверьте, что вы выбрали файл.');
    }

    // Исправляем кодировку имени файла
    const originalName = fixEncoding(req.file.originalname);
    const now = new Date().toISOString().split('T')[0];
    const parentId = req.body.folderId || null;
    const uploadedBy = req.user?.id || null;
    const fileSize = req.file.size;
    const tempFilePath = req.file.path;
    const storedFilename = req.file.filename;

    // Сохраняем в постоянное хранилище через StorageService
    await storageService.save(`documents/${storedFilename}`, tempFilePath);
    
    // Удаляем временный файл
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    // 1. Проверяем, существует ли файл с таким именем в этой папке
    const { rows: existingDocs } = await db.query(
      `SELECT id, name FROM documents 
       WHERE name = $1 AND parent_id ${parentId ? '= $2' : 'IS NULL'} AND type != 'folder' AND deleted_at IS NULL 
       LIMIT 1`,
      parentId ? [originalName, parentId] : [originalName]
    );

    let documentId;
    let versionNumber = 1;

    if (existingDocs.length > 0) {
      // Файл существует -> Создаем новую версию
      documentId = existingDocs[0].id;
      
      const { rows: lastVersion } = await db.query(
        "SELECT MAX(version_number) as max_v FROM document_versions WHERE document_id = $1",
        [documentId]
      );
      versionNumber = (parseInt(lastVersion[0].max_v) || 0) + 1;

      // Обновляем основной документ (размер, дата, имя файла)
      await db.query(
        `UPDATE documents 
         SET size = $1, date = $2, stored_filename = $3, uploaded_by = $4
         WHERE id = $5`,
        [fileSize, now, storedFilename, uploadedBy, documentId]
      );
    } else {
      // Файл не существует -> Создаем новый документ
      documentId = `doc-${Date.now()}`;
      await db.query(
        `INSERT INTO documents (id, name, type, size, date, parent_id, stored_filename, uploaded_by)
         VALUES ($1, $2, 'file', $3, $4, $5, $6, $7)`,
        [documentId, originalName, fileSize, now, parentId, storedFilename, uploadedBy]
      );
    }

    // 2. Создаем запись в таблице версий
    const versionId = `ver-${Date.now()}`;
    await db.query(
      `INSERT INTO document_versions (id, document_id, version_number, stored_filename, size, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [versionId, documentId, versionNumber, storedFilename, fileSize, uploadedBy]
    );

    // 3. Обновляем ссылку на текущую версию
    await db.query(
      "UPDATE documents SET current_version_id = $1 WHERE id = $2",
      [versionId, documentId]
    );

    const { rows: finalDoc } = await db.query("SELECT * FROM documents WHERE id = $1", [documentId]);

    await logAction({
      userId: uploadedBy,
      action: existingDocs.length > 0 ? 'UPDATE' : 'CREATE',
      entityType: 'document_file',
      entityId: documentId,
      newData: { ...finalDoc[0], version: versionNumber },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    sendCreated(res, finalDoc[0]);

    // Фоновое извлечение текста для поиска
    const filePath = await storageService.getFilePath(storedFilename);
    extractTextFromFile(filePath, originalName).then(text => {
      if (text) {
        db.query("UPDATE documents SET content_text = $1 WHERE id = $2", [text, documentId]);
      }
    });
  } catch (err) {
    logger.error("Ошибка при загрузке файла:", err);

    // Удаляем файл с диска, если произошла ошибка
    if (req.file?.filename) {
      await storageService.deleteFile(req.file.filename);
    }

    let errorMessage = 'Не удалось загрузить файл.';
    if (err.code === '23505') {
      errorMessage = 'Файл с таким ID уже существует.';
    } else if (err.code === '23502') {
      errorMessage = 'Отсутствует обязательное поле.';
    } else if (err.message) {
      errorMessage += ' ' + err.message;
    }

    res.status(500).json({ error: errorMessage });
  }
}

/**
 * Проверить существование файла
 * @route POST /api/documents/check-exists
 */
async function checkExists(req, res) {
  const { fileName, fileHash } = req.body;
  
  if (!fileName && !fileHash) {
    return sendValidationError(res, 'Необходимо указать fileName или fileHash');
  }

  let query, params;
  if (fileHash) {
    query = 'SELECT * FROM documents WHERE file_hash = $1 AND deleted_at IS NULL LIMIT 1';
    params = [fileHash];
  } else {
    query = 'SELECT * FROM documents WHERE name = $1 AND type = \'file\' AND deleted_at IS NULL LIMIT 1';
    params = [fileName];
  }

  const { rows } = await db.query(query, params);

  if (rows.length > 0) {
    return sendSuccess(res, {
      exists: true,
      document: rows[0]
    });
  }

  // Также проверим в legacy таблице case_documents, если нужно
  try {
    const legacyTableCheck = fileHash 
      ? await db.query('SELECT id, name FROM case_documents WHERE file_hash = $1 LIMIT 1', [fileHash])
      : await db.query('SELECT id, name FROM case_documents WHERE name = $1 LIMIT 1', [fileName]);
      
    if (legacyTableCheck.rows.length > 0) {
      return sendSuccess(res, {
        exists: true,
        document: { ...legacyTableCheck.rows[0], source: 'legacy' }
      });
    }
  } catch (e) {
    logger.debug('Legacy documents check failed or table not found');
  }

  sendSuccess(res, { exists: false });
}

/**
 * Вычислить хэш файла
 * @route POST /api/documents/compute-hash
 */
async function computeHash(req, res) {
  const { fileName, fileSize } = req.body;
  
  if (!fileName) {
    return sendValidationError(res, 'Имя файла обязательно.');
  }

  const hash = crypto
    .createHash('sha256')
    .update(fileName + (fileSize || ''))
    .digest('hex');

  sendSuccess(res, {
    fileName,
    fileSize,
    hash,
  });
}

/**
 * Обновить статус "избранного"
 * @route PATCH /api/documents/:id/star
 */
async function updateStar(req, res) {
  const { id } = req.params;
  const { starred } = req.body;

  await db.query('UPDATE documents SET starred = $1 WHERE id = $2', [starred, id]);
  const { rows } = await db.query('SELECT * FROM documents WHERE id = $1', [id]);
  
  await logAction({
    userId: req.user?.id,
    action: 'UPDATE',
    entityType: 'document',
    entityId: id,
    newData: { starred },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  sendSuccess(res, rows[0]);
}

/**
 * Обновить флаг "шаблона"
 * @route PATCH /api/documents/:id/template
 */
async function updateTemplateFlag(req, res) {
  const { id } = req.params;
  const { isTemplate } = req.body;

  await db.query('UPDATE documents SET is_template = $1 WHERE id = $2', [isTemplate, id]);
  const { rows } = await db.query('SELECT * FROM documents WHERE id = $1', [id]);
  
  await logAction({
    userId: req.user?.id,
    action: 'UPDATE',
    entityType: 'document',
    entityId: id,
    newData: { isTemplate },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  sendSuccess(res, rows[0]);
}

/**
 * Удалить документы
 * @route POST /api/documents/delete
 */
async function deleteDocuments(req, res) {
  const { ids } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return sendValidationError(res, 'Не указаны ID для удаления.');
  }

  const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');

  await db.query(
    `WITH RECURSIVE descendants AS (
       SELECT id FROM documents WHERE id IN (${placeholders})
       UNION
       SELECT d.id
       FROM documents d
       INNER JOIN descendants parent_docs ON d.parent_id = parent_docs.id
     )
     UPDATE documents 
     SET deleted_at = CURRENT_TIMESTAMP 
     WHERE id IN (SELECT id FROM descendants)`,
     ids
     );

     await logAction({
     userId: req.user?.id,
     action: 'DELETE',
     entityType: 'document',
     entityId: ids.join(','),
     ipAddress: req.ip,
     userAgent: req.headers['user-agent']
     });

     sendSuccess(res, { message: 'Файлы удалены' });
}

/**
 * Удалить документы из корзины окончательно
 * @route POST /api/documents/trash/delete
 */
async function purgeTrashDocuments(req, res) {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return sendValidationError(res, 'Не указаны ID для удаления.');
  }

  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return sendValidationError(res, 'Не указаны ID для удаления.');
  }

  await removeDocumentsPermanentlyByIds(uniqueIds);
  sendSuccess(res, { message: 'Файлы удалены навсегда' });
}

/**
 * Очистить корзину полностью
 * @route POST /api/documents/trash/clear
 */
async function clearTrash(req, res) {
  const { rows } = await db.query('SELECT id FROM documents WHERE deleted_at IS NOT NULL');

  if (rows.length === 0) {
    return sendSuccess(res, { message: 'Корзина уже пуста' });
  }

  await removeDocumentsPermanentlyByIds(rows.map((row) => row.id));
  sendSuccess(res, { message: 'Корзина очищена' });
}

/**
 * Массово переместить документы в папку
 * @route POST /api/documents/bulk-move
 */
async function bulkMoveDocuments(req, res) {
  const { ids, parentId = null } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return sendValidationError(res, 'Не указаны ID для перемещения.');
  }

  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return sendValidationError(res, 'Не указаны ID для перемещения.');
  }

  if (parentId && uniqueIds.includes(parentId)) {
    return sendValidationError(res, 'Нельзя переместить элемент в сам элемент.');
  }

  if (parentId) {
    const { rows: targetFolders } = await db.query(
      'SELECT id, type FROM documents WHERE id = $1 LIMIT 1',
      [parentId]
    );

    if (targetFolders.length === 0 || targetFolders[0].type !== 'folder') {
      return sendValidationError(res, 'Папка назначения не найдена.');
    }
  }

  const placeholders = uniqueIds.map((_, index) => `$${index + 1}`).join(', ');

  await db.query(
    `UPDATE documents SET parent_id = $${uniqueIds.length + 1} WHERE id IN (${placeholders})`,
    [...uniqueIds, parentId]
  );

  const { rows } = await db.query(
    `SELECT * FROM documents WHERE id IN (${placeholders}) ORDER BY date DESC`,
    uniqueIds
  );

  sendSuccess(res, rows);
}

/**
 * Массово переименовать документы
 * @route POST /api/documents/bulk-rename
 */
async function bulkRenameDocuments(req, res) {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return sendValidationError(res, 'Не указаны документы для переименования.');
  }

  const normalizedItems = items
    .map((item) => ({
      id: item?.id ? String(item.id) : '',
      name: typeof item?.name === 'string' ? item.name.trim() : '',
    }))
    .filter((item) => item.id && item.name);

  if (normalizedItems.length === 0) {
    return sendValidationError(res, 'Не указаны документы для переименования.');
  }

  for (const item of normalizedItems) {
    await db.query(
      'UPDATE documents SET name = $1 WHERE id = $2',
      [item.name, item.id]
    );
  }

  const uniqueIds = Array.from(new Set(normalizedItems.map((item) => item.id)));
  const placeholders = uniqueIds.map((_, index) => `$${index + 1}`).join(', ');
  const { rows } = await db.query(
    `SELECT * FROM documents WHERE id IN (${placeholders}) ORDER BY date DESC`,
    uniqueIds
  );

  sendSuccess(res, rows);
}

// Middleware для обработки ошибок multer
const uploadErrorHandler = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: 'Multer error: ' + err.message });
    } else if (err) {
      return res.status(500).json({ error: 'Unknown error: ' + err.message });
    }
    next();
  });
};

// Маршруты
router.use(authMiddleware);

router.get('/', checkPermission('documents.read'), asyncHandler(getAll));
router.get('/path/:id', checkPermission('documents.read'), asyncHandler(getFolderPath));
router.get('/stats', checkPermission('documents.read'), asyncHandler(getStats));
router.post('/folder', checkPermission('documents.write'), asyncHandler(createFolder));
router.post('/upload', checkPermission('documents.write'), uploadErrorHandler, asyncHandler(uploadFile));
router.patch('/:id/star', checkPermission('documents.write'), asyncHandler(updateStar));
router.patch('/:id/template', checkPermission('documents.write'), asyncHandler(updateTemplateFlag));
router.post('/check-exists', checkPermission('documents.read'), asyncHandler(checkExists));
router.post('/compute-hash', checkPermission('documents.read'), asyncHandler(computeHash));
router.post('/restore', checkPermission('documents.write'), asyncHandler(restoreDocuments));
router.post('/delete', checkPermission('documents.delete'), asyncHandler(deleteDocuments));
router.post('/trash/delete', checkPermission('documents.delete'), asyncHandler(purgeTrashDocuments));
router.post('/trash/clear', checkPermission('documents.delete'), asyncHandler(clearTrash));
router.post('/bulk-move', checkPermission('documents.write'), asyncHandler(bulkMoveDocuments));
router.post('/bulk-rename', checkPermission('documents.write'), asyncHandler(bulkRenameDocuments));
router.use('/', documentAccessRouter);


module.exports = router;
