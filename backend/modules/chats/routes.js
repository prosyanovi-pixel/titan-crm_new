const express = require('express');
const router = express.Router();
const controllers = require('./controllers');
const webhooks = require('./webhooks');
const checkPermission = require('../../middleware/checkPermission');

router.post('/webhooks/telegram', webhooks.handleTelegramWebhook);

router.get('/', checkPermission('mail.read'), controllers.getChats);
router.post('/', checkPermission('mail.create'), controllers.createChat);
router.post('/upload', checkPermission('mail.create'), controllers.upload.single('file'), controllers.uploadFile);
router.get('/:id/messages', checkPermission('mail.read'), controllers.getChatMessages);
router.post('/:id/messages', checkPermission('mail.create'), controllers.sendMessage);
router.put('/:id/messages/:messageId', checkPermission('mail.update'), controllers.editMessage);
router.delete('/:id/messages', checkPermission('mail.delete'), controllers.clearChatHistory);
router.put('/:id/read', checkPermission('mail.update'), controllers.markAsRead);
router.delete('/:id', checkPermission('mail.delete'), controllers.deleteChat);

module.exports = router;
