/**
 * Контроллер для CRUD операций с юридическими делами
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../../../utils/errorHandler');
const { sendSuccess, sendCreated, sendNotFound, sendValidationError } = require('../../../utils/responseHelpers');
const logger = require('../../../utils/logger');
const {
  ensureLegalCaseSupportTables,
  extractCasePayload,
} = require('../utils/helpers');
const { getAllCases, getCaseById, createCase, updateCase, deleteCase } = require('../services/cases');
const { markAllCaseUpdatesAsViewed, getUnviewedUpdates, deleteUpdate, deleteAllCaseUpdates } = require('../services/updates');
const { validateCaseData, validateCaseFinancials } = require('../validators/validators');
const { runSync } = require('../services/syncService');

/**
 * Получить все дела
 * @route GET /api/legal-cases/
 */
async function getAll(req, res) {
  await ensureLegalCaseSupportTables();
  const cases = await getAllCases();
  sendSuccess(res, cases);
}

/**
 * Получить дело по ID
 * @route GET /api/legal-cases/:id
 */
async function getById(req, res) {
  await ensureLegalCaseSupportTables();
  const caseData = await getCaseById(req.params.id);

  if (!caseData) {
    return sendNotFound(res, 'Case not found');
  }

  // Получить непросмотренные обновления (БЕЗ отметки как просмотренные автоматически)
  const unviewedUpdates = await getUnviewedUpdates(req.params.id);

  // Добавить информацию об обновлениях в ответ
  const response = {
    ...caseData,
    unviewedUpdates: unviewedUpdates || [],
    hasUnviewedUpdates: unviewedUpdates && unviewedUpdates.length > 0,
  };

  sendSuccess(res, response);
}

/**
 * Создать дело
 * @route POST /api/legal-cases/
 */
async function create(req, res) {
  await ensureLegalCaseSupportTables();

  logger.info('[CREATE CASE] Received request body:', {
    title: req.body.title,
    type: req.body.type,
    status: req.body.status,
    lawyerId: req.body.lawyerId || req.body.lawyer_id,
    caseNumber: req.body.caseNumber || req.body.case_number,
    creationDate: req.body.creationDate || req.body.creation_date,
    bodyKeys: Object.keys(req.body)
  });

  // extractCasePayload возвращает просто объект, не { raw, cleaned }
  const cleaned = extractCasePayload(req.body);

  logger.info('[CREATE CASE] After extraction:', {
    cleanedTitle: cleaned.title,
    cleanedType: cleaned.type,
    cleanedStatus: cleaned.status,
    cleanedLawyerId: cleaned.lawyerId || cleaned.lawyer_id,
    cleanedCaseNumber: cleaned.caseNumber || cleaned.case_number,
    cleanedCreationDate: cleaned.creationDate || cleaned.creation_date
  });

  // Валидация основных данных
  const validation = validateCaseData(cleaned);
  if (!validation.valid) {
    logger.error('[CREATE CASE] Validation failed:', validation.errors);
    return sendValidationError(res, validation.errors.join(', '));
  }

  // Валидация финансовых данных
  const financialValidation = validateCaseFinancials(cleaned);

  // Генерируем ID
  const id = `case-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Создаём дело
  const caseData = {
    ...validation.data,
    id,
    events: cleaned.events,
    thirdParties: cleaned.thirdParties,
    documents: cleaned.documents,
  };

  const created = await createCase(caseData, financialValidation.data);
  sendCreated(res, created);
}

/**
 * Обновить дело
 * @route PUT /api/legal-cases/:id
 */
async function update(req, res) {
  await ensureLegalCaseSupportTables();

  const { id } = req.params;
  const userId = req.headers['x-user-id'] || '';
  const cleaned = extractCasePayload(req.body);

  logger.info(`UPDATE case ${id}`, { 
    userId,
    hasNotes: Array.isArray(req.body.notes),
    notesCount: req.body.notes?.length || 0,
    hasAttachments: req.body.notes?.some(n => n.attachments?.length > 0)
  });

  // Проверяем существование
  const existing = await getCaseById(id);
  if (!existing) {
    return sendNotFound(res, 'Case not found');
  }

  // Валидация
  const validation = validateCaseData(cleaned);
  if (!validation.valid) {
    return sendValidationError(res, validation.errors.join(', '));
  }

  // Финансовые данные
  const financialValidation = validateCaseFinancials(cleaned);

  // Проверяем авторизацию для приватных заметок
  if (Array.isArray(req.body.notes)) {
    const privateNotes = req.body.notes.filter(n => n.isInternal);
    if (privateNotes.length > 0 && !userId) {
      return res.status(403).json({ 
        error: 'Authorization required for private notes',
        message: 'x-user-id header is required'
      });
    }
  }

  // Обновляем
  const updates = {
    ...validation.data,
    financials: financialValidation.data,
    notes: req.body.notes, // Передаем заметки напрямую из body
    documents: req.body.documents,
  };

  const updated = await updateCase(id, updates);
  sendSuccess(res, updated);
}

/**
 * Удалить дело
 * @route DELETE /api/legal-cases/:id
 */
async function remove(req, res) {
  await ensureLegalCaseSupportTables();

  const { id } = req.params;
  const deleted = await deleteCase(id);

  if (!deleted) {
    return sendNotFound(res, 'Case not found');
  }

  sendSuccess(res, { success: true, message: 'Case deleted' });
}

/**
 * Получить непросмотренные обновления для дела
 * @route GET /api/legal-cases/:id/updates/unviewed
 */
async function getUnviewedCaseUpdates(req, res) {
  try {
    const { id } = req.params;
    const updates = await getUnviewedUpdates(id);
    sendSuccess(res, updates);
  } catch (err) {
    logger.error('[GET UNVIEWED UPDATES] Error:', err);
    res.status(500).json({ error: 'Failed to get unviewed updates' });
  }
}

/**
 * Отметить все обновления как просмотренные вручную
 * @route POST /api/legal-cases/:id/updates/mark-viewed
 */
async function markUpdatesAsViewed(req, res) {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const updates = await markAllCaseUpdatesAsViewed(id, userId);
    sendSuccess(res, {
      message: 'Updates marked as viewed',
      count: updates.length,
      updates
    });
  } catch (err) {
    logger.error('[MARK UPDATES VIEWED] Error:', err);
    res.status(500).json({ error: 'Failed to mark updates as viewed' });
  }
}

/**
 * Удалить одно обновление дела
 * @route DELETE /api/legal-cases/:id/updates/:updateId
 */
async function removeUpdate(req, res) {
  try {
    const { id, updateId } = req.params;
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const success = await deleteUpdate(updateId);
    if (!success) {
      return sendNotFound(res, 'Update not found');
    }

    logger.info('[DELETE UPDATE] Update deleted by user:', {
      caseId: id,
      updateId,
      userId
    });

    sendSuccess(res, {
      message: 'Update deleted successfully',
      updateId
    });
  } catch (err) {
    logger.error('[DELETE UPDATE] Error:', err);
    res.status(500).json({ error: 'Failed to delete update' });
  }
}

/**
 * Удалить все обновления дела
 * @route DELETE /api/legal-cases/:id/updates
 */
async function removeAllUpdates(req, res) {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    const count = await deleteAllCaseUpdates(id);

    logger.info('[DELETE ALL UPDATES] All case updates deleted by user:', {
      caseId: id,
      count,
      userId
    });

    sendSuccess(res, {
      message: 'All updates deleted successfully',
      count,
      caseId: id
    });
  } catch (err) {
    logger.error('[DELETE ALL UPDATES] Error:', err);
    res.status(500).json({ error: 'Failed to delete all updates' });
  }
}

/**
 * Синхронизировать дела с КАД
 * @route POST /api/legal-cases/sync
 */
async function syncCases(req, res) {
  const result = await runSync();
  sendSuccess(res, result);
}

// Маршруты
router.get('/', asyncHandler(getAll));
router.get('/:id', asyncHandler(getById));
router.get('/:id/updates/unviewed', asyncHandler(getUnviewedCaseUpdates));
router.post('/:id/updates/mark-viewed', asyncHandler(markUpdatesAsViewed));
router.delete('/:id/updates/:updateId', asyncHandler(removeUpdate));
router.delete('/:id/updates', asyncHandler(removeAllUpdates));
router.post('/sync', asyncHandler(syncCases));
router.post('/', asyncHandler(create));
router.put('/:id', asyncHandler(update));
router.delete('/:id', asyncHandler(remove));

module.exports = router;
