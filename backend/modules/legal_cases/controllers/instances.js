/**
 * Контроллер для работы с инстанциями дел
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../../../utils/errorHandler');
const { sendSuccess, sendCreated, sendNotFound, sendValidationError } = require('../../../utils/responseHelpers');
const logger = require('../../../utils/logger');
const {
  getInstancesByCaseId,
  getInstanceById,
  createInstance,
  updateInstance,
  deleteInstance
} = require('../services/instances');
const { addCaseEvent } = require('../services/cases');

/**
 * Получить список инстанций для конкретного дела
 * @route GET /api/legal-cases/:id/instances
 */
async function getByCaseId(req, res) {
  const { id } = req.params;
  const instances = await getInstancesByCaseId(id);
  sendSuccess(res, instances);
}

/**
 * Создать новую инстанцию для дела
 * @route POST /api/legal-cases/:id/instances
 */
async function create(req, res) {
  const { id } = req.params;
  const data = {
    ...req.body,
    caseId: id
  };

  if (!data.instance_number && !data.instanceNumber) {
    return sendValidationError(res, 'Instance number is required');
  }

  if (!data.instance_type && !data.instanceType) {
    return sendValidationError(res, 'Instance type is required');
  }

  const created = await createInstance(data);

  // Добавляем в Таймлайн
  try {
    const typeLabel = data.instanceType === 'first' ? 'Первая инстанция' : 
                      data.instanceType === 'appeal' ? 'Апелляция' : 
                      data.instanceType === 'cassation' ? 'Кассация' : 'Надзор';
    await addCaseEvent(id, {
      title: 'Новая инстанция',
      description: `Добавлена инстанция: ${typeLabel}. Номер: ${data.instanceNumber || data.instance_number}`,
      type: 'court',
      author: 'system',
      instance_id: created.id
    });
  } catch (err) {
    logger.warn('Failed to create timeline event for instance creation', err);
  }

  sendCreated(res, created);
}

/**
 * Обновить данные инстанции
 * @route PATCH /api/legal-cases/instances/:instanceId
 */
async function update(req, res) {
  const { instanceId } = req.params;
  const updated = await updateInstance(instanceId, req.body);

  if (!updated) {
    return sendNotFound(res, 'Instance not found');
  }

  // Если изменился статус или номер, добавляем событие
  if (req.body.status || req.body.instanceNumber || req.body.instance_number) {
    try {
      await addCaseEvent(updated.caseId || updated.case_id, {
        title: 'Данные инстанции обновлены',
        description: `Изменения: ${req.body.status ? `статус: ${req.body.status}` : ''} ${req.body.instanceNumber || req.body.instance_number ? `номер: ${req.body.instanceNumber || req.body.instance_number}` : ''}`,
        type: 'court',
        author: 'system',
        instance_id: instanceId
      });
    } catch (err) {
      logger.warn('Failed to create timeline event for instance update', err);
    }
  }

  sendSuccess(res, updated);
}

/**
 * Удалить инстанцию
 * @route DELETE /api/legal-cases/instances/:instanceId
 */
async function remove(req, res) {
  const { instanceId } = req.params;
  const deleted = await deleteInstance(instanceId);

  if (!deleted) {
    return sendNotFound(res, 'Instance not found');
  }

  sendSuccess(res, { success: true, message: 'Instance deleted' });
}

// Маршруты для работы через ID дела
router.get('/:id/instances', asyncHandler(getByCaseId));
router.post('/:id/instances', asyncHandler(create));

// Маршруты для прямой работы с инстанцией
router.patch('/instances/:instanceId', asyncHandler(update));
router.delete('/instances/:instanceId', asyncHandler(remove));

module.exports = router;
