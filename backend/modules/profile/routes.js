/**
 * Маршруты модуля Profile
 */

const express = require('express');
const router = express.Router();
const controllers = require('./controllers');

// GET /api/profile - Текущий пользователь
router.get('/', controllers.getCurrent);

// PATCH /api/profile - Обновление текущего профиля
router.patch('/', controllers.updateCurrent);

// POST /api/profile/avatar - Загрузка аватара текущего профиля
router.post('/avatar', controllers.avatarUploadHandler, controllers.uploadAvatarCurrent);

// POST /api/profile/change-password - Смена пароля
router.post('/change-password', controllers.changePassword);

// POST /api/profile/share-links - Создание ссылки доступа
router.post('/share-links', controllers.createShareLink);

// DELETE /api/profile/share-links/:linkId - Удаление ссылки
router.delete('/share-links/:linkId', controllers.deleteShareLink);

// GET /api/profile/:userId/documents - Документы пользователя
router.get('/:userId/documents', controllers.getUserDocuments);

// GET /api/profile/:id - Профиль по ID
router.get('/:id', controllers.getById);

// PUT /api/profile/:id - Обновление профиля
router.put('/:id', controllers.update);

// POST /api/profile/:id/avatar - Загрузка аватара
router.post('/:id/avatar', controllers.avatarUploadHandler, controllers.uploadAvatar);

module.exports = router;
