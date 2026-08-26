/**
 * Маршруты модуля Mail
 * Тонкий слой: только определение маршрутов → контроллеры
 */

const express = require('express');
const router = express.Router();
const c = require('./controllers');

// ---------- helper: require user-id ----------

const userId = (req, res) => {
  const id = req.get('x-user-id');
  if (!id) {
    res.status(401).json({ error: 'User ID required' });
    return null;
  }
  return id;
};

// ---------- MAIL ACCOUNTS ----------

router.get('/accounts',          (req, res) => { if (userId(req, res)) c.getAccounts(req, res); });
router.get('/accounts/:accountId', (req, res) => { if (userId(req, res)) c.getAccount(req, res); });
router.post('/accounts',         (req, res) => { if (userId(req, res)) c.createAccount(req, res); });
router.put('/accounts/:accountId', (req, res) => { if (userId(req, res)) c.updateAccount(req, res); });
router.post('/accounts/:accountId/test', (req, res) => { if (userId(req, res)) c.testAccount(req, res); });
router.post('/test-connection',  (req, res) => { if (userId(req, res)) c.testConnectionTemp(req, res); });
router.post('/accounts/:accountId/sync', (req, res) => { if (userId(req, res)) c.syncAccount(req, res); });
router.delete('/accounts/:accountId/mails', (req, res) => { if (userId(req, res)) c.clearAccountMails(req, res); });
router.delete('/accounts/:accountId', (req, res) => { if (userId(req, res)) c.deleteAccount(req, res); });
router.post('/accounts/:accountId/imap-folders', (req, res) => { if (userId(req, res)) c.getImapFolders(req, res); });
router.post('/accounts/:accountId/sync-folders', (req, res) => { if (userId(req, res)) c.syncFolders(req, res); });

// ---------- FOLDERS ----------

router.get('/folders/:accountId', (req, res) => { if (userId(req, res)) c.getFolders(req, res); });
router.get('/folders/:accountId/stats', (req, res) => { if (userId(req, res)) c.getFolderStats(req, res); });
router.post('/folders/:accountId/cleanup-duplicates', (req, res) => { if (userId(req, res)) c.cleanupDuplicateFolders(req, res); });
router.post('/folders',          (req, res) => { if (userId(req, res)) c.createFolder(req, res); });
router.post('/folders/:folderId/clear', (req, res) => { if (userId(req, res)) c.clearFolder(req, res); });
router.post('/folders/:folderId/clear-local', (req, res) => { if (userId(req, res)) c.clearFolderLocal(req, res); });
router.patch('/folders/:folderId/read-all', (req, res) => { if (userId(req, res)) c.markFolderAllRead(req, res); });
router.put('/folders/:folderId', (req, res) => { if (userId(req, res)) c.updateFolder(req, res); });
router.delete('/folders/:folderId', (req, res) => { if (userId(req, res)) c.deleteFolder(req, res); });

// ---------- FILTERS ----------

router.get('/filters/:accountId', (req, res) => { if (userId(req, res)) c.getFilters(req, res); });
router.post('/filters',          (req, res) => { if (userId(req, res)) c.createFilter(req, res); });
router.put('/filters/:filterId', (req, res) => { if (userId(req, res)) c.updateFilter(req, res); });
router.delete('/filters/:filterId', (req, res) => { if (userId(req, res)) c.deleteFilter(req, res); });
router.post('/filters/:filterId/apply', (req, res) => { if (userId(req, res)) c.applyFilter(req, res); });
router.post('/filters/apply-all', (req, res) => { if (userId(req, res)) c.applyAllFilters(req, res); });

// ---------- MESSAGES ----------

router.get('/',                  (req, res) => { if (userId(req, res)) c.getAllMails(req, res); });
router.get('/:id',               (req, res) => { if (userId(req, res)) c.getMailById(req, res); });
router.post('/',                 (req, res) => { if (userId(req, res)) c.sendMail(req, res); });

// ---------- ATTACHMENTS ----------

router.post('/:mailId/attachments', (req, res) => {
  c.upload.array('files', 10)(req, res, async (err) => {
    if (err) {
      console.error('Attachment upload middleware error:', err);
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    if (!userId(req, res)) return;
    await c.uploadAttachments(req, res);
  });
});

router.get('/:mailId/attachments', (req, res) => { if (userId(req, res)) c.getAttachments(req, res); });
router.get('/attachments/download/:attachmentId', (req, res) => { if (userId(req, res)) c.downloadAttachment(req, res); });
router.delete('/attachments/:attachmentId', (req, res) => { if (userId(req, res)) c.deleteAttachment(req, res); });
router.post('/attachments/:attachmentId/save-to-docs', (req, res) => { if (userId(req, res)) c.saveToDocuments(req, res); });

// ---------- MAIL OPERATIONS ----------

router.patch('/:id/read',        (req, res) => { if (userId(req, res)) c.markRead(req, res); });
router.get('/:id/thread',        (req, res) => { if (userId(req, res)) c.getMailThread(req, res); });
router.patch('/:id/star',        (req, res) => { if (userId(req, res)) c.toggleStar(req, res); });
router.patch('/:id/move',        (req, res) => { if (userId(req, res)) c.moveMail(req, res); });
router.delete('/:id',            (req, res) => { if (userId(req, res)) c.deleteMail(req, res); });

// ---------- BULK ----------

router.post('/bulk/read',        (req, res) => { if (userId(req, res)) c.bulkRead(req, res); });
router.post('/bulk/move',        (req, res) => { if (userId(req, res)) c.bulkMove(req, res); });
router.post('/bulk/delete',      (req, res) => { if (userId(req, res)) c.bulkDelete(req, res); });

// ---------- MISC ----------

router.get('/scheduler/status',  (req, res) => c.getSchedulerStatus(req, res));
router.get('/websocket/status',  (req, res) => c.getWebsocketStatus(req, res));

// ---------- TEMPLATES ----------

router.get('/templates',         (req, res) => { if (userId(req, res)) c.getTemplates(req, res); });
router.post('/templates',        (req, res) => { if (userId(req, res)) c.createTemplate(req, res); });
router.put('/templates/:id',     (req, res) => { if (userId(req, res)) c.updateTemplate(req, res); });
router.delete('/templates/:id',  (req, res) => { if (userId(req, res)) c.deleteTemplate(req, res); });

// ---------- SYSTEM / TRANSACTIONAL ----------

router.post('/system/send-welcome', (req, res) => {
  if (c.sendWelcomeEmail) return c.sendWelcomeEmail(req, res);
  res.status(501).json({ error: 'System mail service not available' });
});

module.exports = router;
