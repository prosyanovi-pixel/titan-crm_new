/**
 * Контроллеры модуля Mail
 * Точка входа — ре-экспорт из контроллеров по доменам:
 *   accounts    — CRUD аккаунтов, тест, синхронизация
 *   folders     — CRUD папок, IMAP папки, очистка, дубликаты
 *   filters     — CRUD фильтров, применение
 *   messages    — получение, отправка, удаление, перемещение писем
 *   attachments — загрузка, скачивание, удаление вложений
 *   misc        — статус scheduler, WebSocket
 */

const accounts    = require('./accounts');
const folders     = require('./folders');
const filters     = require('./filters');
const messages    = require('./messages');
const attachments = require('./attachments');
const templates   = require('./templates');
const misc        = require('./misc');
// const system      = require('./system');

const utils       = require('../utils/helpers');

module.exports = {
  // Helpers (для использования в других модулях и роутах)
  decodeFilename:              utils.decodeFilename,
  toCanonicalFolderType:       utils.toCanonicalFolderType,
  normalizeAccount:            utils.normalizeAccount,
  requireAccount:              utils.requireAccount,
  getSentFolderId:             utils.getSentFolderId,
  getDraftsFolderId:           utils.getDraftsFolderId,
  applyActualAttachmentFlags:  utils.applyActualAttachmentFlags,
  createSystemFolders:         utils.createSystemFolders,
  deleteFromImap:              utils.deleteFromImap,
  moveOnImap:                  utils.moveOnImap,
  upload:                      utils.upload,
  uploadsDir:                  utils.uploadsDir,
  encryptPassword:             require('../utils/mailCrypto').encryptPassword,
  decryptPassword:             require('../utils/mailCrypto').decryptPassword,

  // Accounts
  getAccounts:              accounts.getAccounts,
  getAccount:               accounts.getAccount,
  createAccount:            accounts.createAccount,
  updateAccount:            accounts.updateAccount,
  testAccount:              accounts.testAccount,
  testConnectionTemp:       accounts.testConnectionTemp,
  deleteAccount:            accounts.deleteAccount,
  syncAccount:              accounts.syncAccount,

  // Folders
  getFolders:               folders.getFolders,
  getFolderStats:           folders.getFolderStats,
  cleanupDuplicateFolders:  folders.cleanupDuplicateFolders,
  getImapFolders:           folders.getImapFolders,
  syncFolders:              folders.syncFolders,
  createFolder:             folders.createFolder,
  updateFolder:             folders.updateFolder,
  deleteFolder:             folders.deleteFolder,
  clearFolder:              folders.clearFolder,
  clearFolderLocal:         folders.clearFolderLocal,
  markFolderAllRead:        folders.markFolderAllRead,

  // Filters
  getFilters:               filters.getFilters,
  createFilter:             filters.createFilter,
  updateFilter:             filters.updateFilter,
  deleteFilter:             filters.deleteFilter,
  applyFilter:              filters.applyFilter,
  applyAllFilters:          filters.applyAllFilters,

  // Messages
  getAllMails:              messages.getAllMails,
  getMailById:              messages.getMailById,
  sendMail:                 messages.sendMail,
  markRead:                 messages.markRead,
  toggleStar:               messages.toggleStar,
  moveMail:                 messages.moveMail,
  deleteMail:               messages.deleteMail,
  bulkRead:                 messages.bulkRead,
  bulkMove:                 messages.bulkMove,
  bulkDelete:               messages.bulkDelete,
  getMailThread:            messages.getMailThread,
  clearAccountMails:        messages.clearAccountMails,

  // Attachments
  uploadAttachments:        attachments.uploadAttachments,
  getAttachments:           attachments.getAttachments,
  downloadAttachment:       attachments.downloadAttachment,
  deleteAttachment:         attachments.deleteAttachment,

  // Templates
  getTemplates:             templates.getTemplates,
  createTemplate:           templates.createTemplate,
  updateTemplate:           templates.updateTemplate,
  deleteTemplate:           templates.deleteTemplate,

  // Misc
  getSchedulerStatus:       misc.getSchedulerStatus,
  getWebsocketStatus:       misc.getWebsocketStatus,

  // System (Transactional Emails)
  // sendWelcomeEmail:         system.sendWelcomeEmail,
};
