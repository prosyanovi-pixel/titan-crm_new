/**
 * Маршруты модуля Calendar
 */

const express = require('express');
const router = express.Router();
const controllers = require('./controllers');

// GET /api/calendar/events - Получить все события
router.get('/events', controllers.getAllEvents);

// GET /api/calendar/events/:id - Получить событие по ID
router.get('/events/:id', controllers.getEventById);

// POST /api/calendar/events - Создать событие
router.post('/events', controllers.createEvent);

// PUT /api/calendar/events/:id - Обновить событие
router.put('/events/:id', controllers.updateEvent);

// DELETE /api/calendar/events/:id - Удалить событие
router.delete('/events/:id', controllers.deleteEvent);

module.exports = router;
