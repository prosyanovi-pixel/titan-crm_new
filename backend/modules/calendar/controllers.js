/**
 * Контроллеры модуля Calendar
 * Обработчики HTTP-запросов для управления событиями календаря
 */

const { asyncHandler } = require('../../utils/errorHandler');
const { sendSuccess, sendCreated, sendNotFound, sendValidationError } = require('../../utils/responseHelpers');
const db = require('../../db');
const { addCaseEvent } = require('../legal_cases/services/cases');

/**
 * Загрузка уведомлений для события
 * @param {string} eventId - ID события
 * @returns {Promise<Array>} Список уведомлений
 */
const loadEventNotifications = async (eventId) => {
  const { rows } = await db.query(
    'SELECT * FROM calendar_event_notifications WHERE event_id = $1',
    [eventId]
  );
  return rows;
};

/**
 * Загрузка события по ID
 * @param {string} id - ID события
 * @returns {Promise<Object|null>} Событие или null
 */
const loadEventById = async (id) => {
  const { rows } = await db.query('SELECT * FROM calendar_events WHERE id = $1', [id]);
  if (rows.length === 0) return null;

  const event = rows[0];
  event.notifications = await loadEventNotifications(id);
  // Маппинг полей для совместимости с фронтендом
  event.startDate = event.date;
  event.endDate = event.end_date;
  event.contractorId = event.client;
  event.projectId = event.project_id;

  return event;
};

/**
 * Проверка существования таблицы (для плавного деградации)
 */
async function checkTableExists() {
  try {
    await db.query('SELECT 1 FROM calendar_events LIMIT 1');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Получить все события
 * @route GET /api/calendar/events
 * @returns {Array} Список событий
 */
const getAllEvents = asyncHandler(async (req, res) => {
  const tableExists = await checkTableExists();
  if (!tableExists) {
    return sendSuccess(res, []);
  }

  const { rows } = await db.query('SELECT * FROM calendar_events ORDER BY date, time');

  // Загрузка уведомлений и маппинг полей для фронтенда
  const events = [];
  for (let event of rows) {
    event.notifications = await loadEventNotifications(event.id);
    // Маппинг полей для совместимости с фронтендом
    event.startDate = event.date;
    event.endDate = event.end_date;
    event.contractorId = event.client;
    event.projectId = event.project_id;
    events.push(event);
  }

  sendSuccess(res, events);
});

/**
 * Получить событие по ID
 * @route GET /api/calendar/events/:id
 * @param {string} req.params.id - ID события
 * @returns {Object} Событие с уведомлениями
 */
const getEventById = asyncHandler(async (req, res) => {
  const tableExists = await checkTableExists();
  if (!tableExists) {
    return sendNotFound(res, 'Calendar events table not found');
  }

  const { id } = req.params;
  const event = await loadEventById(id);

  if (!event) {
    return sendNotFound(res, 'Event not found');
  }

  sendSuccess(res, event);
});

/**
 * Создать событие
 * @route POST /api/calendar/events
 * @param {Object} req.body - Данные события
 * @returns {Object} Созданное событие
 */
const createEvent = asyncHandler(async (req, res) => {
  const tableExists = await checkTableExists();
  if (!tableExists) {
    return sendValidationError(res, 'Calendar events table not found');
  }

  const {
    title, startDate, endDate, type, status, time, endTime, description,
    allDay, location, contractorId, projectId, assignee, priority,
    notifyClient, clientNotifyChannel, clientNotifyTarget,
    createFollowUpTask,
    notifyAssignee, assigneeNotifyChannel, assigneeNotifyTarget,
    notifications = []
  } = req.body;

  // Валидация обязательных полей
  if (!title || !startDate) {
    return sendValidationError(res, 'Title and date are required');
  }

  const id = 'evt-' + Math.floor(Math.random() * 1000000);

  const { rows } = await db.query(
    `INSERT INTO calendar_events (
        id, title, date, end_date, type, status, time, end_time, description,
        all_day, location, client, project_id, assignee, priority,
        notify_client, client_notify_channel, client_notify_target,
        create_follow_up_task,
        notify_assignee, assignee_notify_channel, assignee_notify_target
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
     RETURNING *`,
    [
      id, title, startDate, endDate, type || 'meeting', status || 'pending', time ?? null, endTime ?? null, description ?? null,
      allDay || false, location ?? null, contractorId || null, projectId || null, assignee || null, priority || 'Medium',
      notifyClient || false, clientNotifyChannel ?? null, clientNotifyTarget ?? null,
      createFollowUpTask || false,
      notifyAssignee || false, assigneeNotifyChannel ?? null, assigneeNotifyTarget ?? null
    ]
  );

  const event = rows[0];

  // Сохранение уведомлений
  if (Array.isArray(notifications) && notifications.length > 0) {
    for (const notif of notifications) {
      const notifId = 'notif-' + Math.floor(Math.random() * 1000000);
      await db.query(
        `INSERT INTO calendar_event_notifications (id, event_id, type, value, unit)
         VALUES ($1, $2, $3, $4, $5)`,
        [notifId, id, notif.type || 'relative', notif.value, notif.unit || 'minutes']
      );
    }
  }

  const fullEvent = await loadEventById(id);

  // --- ИНТЕГРАЦИЯ С ТАЙМЛАЙНОМ МОДУЛЕЙ ---
  if (projectId) {
    try {
      const isReminder = type === 'reminder';
      const typeLabel = isReminder ? 'Напоминание' : 'Событие';
      await addCaseEvent(projectId, {
        title: `${typeLabel} (из быстрых действий)`,
        description: `Добавлено ${typeLabel.toLowerCase()}: ${title}. ${location ? `Место: ${location}.` : ''} ${description || ''}`,
        type: 'quick_action',
        author: assignee || 'автор'
      });
    } catch (err) {
      console.warn('[Calendar] Failed to link event to legal case timeline:', err.message);
    }
  }

  sendCreated(res, fullEvent);
});

/**
 * Обновить событие
 * @route PUT /api/calendar/events/:id
 * @param {string} req.params.id - ID события
 * @param {Object} req.body - Обновлённые данные
 * @returns {Object} Обновлённое событие
 */
const updateEvent = asyncHandler(async (req, res) => {
  const tableExists = await checkTableExists();
  if (!tableExists) {
    return sendNotFound(res, 'Calendar events table not found');
  }

  const { id } = req.params;
  
  // Получаем текущее событие
  const { rows: currentRows } = await db.query('SELECT * FROM calendar_events WHERE id = $1', [id]);
  if (currentRows.length === 0) {
    return sendNotFound(res, 'Event not found');
  }
  
  const currentEvent = currentRows[0];
  
  // Берём значения из req.body или оставляем текущие
  const {
    title = currentEvent.title,
    startDate = currentEvent.date,
    endDate = currentEvent.end_date,
    type = currentEvent.type,
    status = currentEvent.status,
    time = currentEvent.time,
    endTime = currentEvent.end_time,
    description = currentEvent.description,
    allDay = currentEvent.all_day,
    location = currentEvent.location,
    contractorId = currentEvent.client,
    projectId = currentEvent.project_id,
    assignee = currentEvent.assignee,
    priority = currentEvent.priority,
    notifyClient = currentEvent.notify_client,
    clientNotifyChannel = currentEvent.client_notify_channel,
    clientNotifyTarget = currentEvent.client_notify_target,
    createFollowUpTask = currentEvent.create_follow_up_task,
    notifyAssignee = currentEvent.notify_assignee,
    assigneeNotifyChannel = currentEvent.assignee_notify_channel,
    assigneeNotifyTarget = currentEvent.assignee_notify_target,
    notifications = null
  } = req.body;

  const { rows } = await db.query(
    `UPDATE calendar_events SET
        title = $1, date = $2, end_date = $3, type = $4, status = $5, time = $6, end_time = $7, description = $8,
        all_day = $9, location = $10, client = $11, project_id = $12, assignee = $13, priority = $14,
        notify_client = $15, client_notify_channel = $16, client_notify_target = $17,
        create_follow_up_task = $18,
        notify_assignee = $19, assignee_notify_channel = $20, assignee_notify_target = $21
     WHERE id = $22
     RETURNING *`,
    [
      title, startDate, endDate, type, status, time, endTime, description,
      allDay, location, contractorId, projectId, assignee, priority,
      notifyClient, clientNotifyChannel, clientNotifyTarget,
      createFollowUpTask,
      notifyAssignee, assigneeNotifyChannel, assigneeNotifyTarget,
      id
    ]
  );

  if (rows.length === 0) {
    return sendNotFound(res, 'Event not found');
  }

  // Обновление уведомлений (если переданы)
  if (notifications !== null && Array.isArray(notifications)) {
    // Удаляем старые
    await db.query('DELETE FROM calendar_event_notifications WHERE event_id = $1', [id]);
    
    // Добавляем новые
    for (const notif of notifications) {
      const notifId = 'notif-' + Math.floor(Math.random() * 1000000);
      await db.query(
        `INSERT INTO calendar_event_notifications (id, event_id, type, value, unit)
         VALUES ($1, $2, $3, $4, $5)`,
        [notifId, id, notif.type || 'relative', notif.value, notif.unit || 'minutes']
      );
    }
  }

  const updatedEvent = await loadEventById(id);
  sendSuccess(res, updatedEvent);
});

/**
 * Удалить событие
 * @route DELETE /api/calendar/events/:id
 * @param {string} req.params.id - ID события
 * @returns {Object} Статус успеха
 */
const deleteEvent = asyncHandler(async (req, res) => {
  const tableExists = await checkTableExists();
  if (!tableExists) {
    return sendNotFound(res, 'Calendar events table not found');
  }

  const { id } = req.params;
  const { rows } = await db.query(
    'DELETE FROM calendar_events WHERE id = $1 RETURNING *',
    [id]
  );

  if (rows.length === 0) {
    return sendNotFound(res, 'Event not found');
  }

  sendSuccess(res, { success: true, message: 'Event deleted' });
});

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};
