/**
 * Mail Sync Service
 * Сервис синхронизации почты с IMAP серверами
 *
 * Основные функции:
 * - Подключение к IMAP
 * - Загрузка писем
 * - Парсинг MIME сообщений
 * - Загрузка вложений
 * - Инкрементальная синхронизация
 */

const Imap = require('imap');
const { simpleParser } = require('mailparser');
const db = require('../../../db');
const connectionManager = require('./mailConnectionManager');
const logger = require('../../../utils/logger');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const mailFilterEngine = require('./mailFilterEngine');
const websocketServer = require('../../../modules/notifications/services/websocketServer');
const { validateImapPath, validateFolderName } = require('../utils/fieldNormalizer');
const mailConfig = require('../config');

// Новые сервисы
const ImapService = require('./imap/ImapService');
const MailParserService = require('./parser/MailParserService');
const MailPersistenceService = require('./persistence/MailPersistenceService');
const MailFolderFilterService = require('./MailFolderFilterService');
const MailMessageProcessingService = require('./MailMessageProcessingService');
const fetchMessagesModule = require('./syncParts/fetchMessages');

class MailSyncService {
  constructor() {
    // Максимальное количество писем за одну синхронизацию
    this.maxMessagesPerSync = mailConfig.sync.maxMessagesPerSync;
    // Максимальный размер вложения
    this.maxAttachmentSize = mailConfig.attachments.maxSize;
    // Папка для вложений (относительно корня backend)
    this.uploadsDir = path.join(__dirname, `../../../${mailConfig.attachments.uploadDir}`);
    // Таймауты операций IMAP
    this.imapConnectTimeout = mailConfig.imap.connectTimeout;
    this.imapFoldersTimeout = mailConfig.imap.foldersTimeout;
    // Таймауты синхронизации
    this.baseFolderSyncTimeout = mailConfig.sync.baseFolderSyncTimeout;
    this.baseFetchMessagesTimeout = mailConfig.sync.baseFetchMessagesTimeout;
    this.timeoutPer1000Emails = mailConfig.sync.timeoutPer1000Emails;
    this.fetchTimeoutPer1000Emails = mailConfig.sync.fetchTimeoutPer1000Emails;

    // Создаём директорию для вложений
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }

    // Инициализируем новые сервисы
    this.imapService = new ImapService();
    this.parserService = new MailParserService();
    this.persistenceService = new MailPersistenceService(this.uploadsDir, this.maxAttachmentSize);
    this.folderFilterService = new MailFolderFilterService();
    this.messageProcessingService = new MailMessageProcessingService(this.persistenceService, this.parserService);
  }

  /**
   * Подсчитать количество писем во всех папках (для прогресс-бара)
   */
  async countFolderEmails(imap, folders, account) {
    return this.imapService.countFolderEmails(imap, folders, async (accountId, folderName) => {
      return this.persistenceService.getSyncState(accountId, folderName);
    });
  }

  /**
   * Синхронизировать почтовый аккаунт
   * @param {Object} account - Аккаунт из БД
   * @param {Object} options - Опции синхронизации
   */
  async syncAccount(account, options = {}) {
    const { background = false, folderName = null, syncFolders = null } = options;
    const accountId = account.id;
    const userId = account.userId;
    const syncId = `sync_${uuidv4()}`;

    logger.info(`[MailSync] Starting sync for ${account.email} (background: ${background})`);

    // Отправляем уведомление о начале синхронизации
    websocketServer.notifySyncStatus(userId, {
      status: 'started',
      accountId,
      message: 'Начало синхронизации...'
    });

    // Создаём лог синхронизации
    await this.createSyncLog(syncId, accountId, background ? 'incremental' : 'full');

    try {
      // Получаем IMAP подключение
      logger.info(`[MailSync] Connecting to IMAP for ${account.email}...`);
      const imap = await this.withTimeout(
        connectionManager.getImapConnection(account),
        this.imapConnectTimeout,
        'IMAP connection timeout'
      );
      logger.info(`[MailSync] IMAP connection ready for ${account.email}`);

      // Получаем список папок
      logger.info(`[MailSync] Loading IMAP folders for ${account.email}...`);
      const folders = await this.withTimeout(
        this.getFolders(imap),
        this.imapFoldersTimeout,
        'IMAP folders loading timeout'
      );
      logger.debug(`[MailSync] Found ${folders.length} folders for ${account.email}`);
      logger.info(`[MailSync] Found ${folders.length} IMAP folders for ${account.email}`);

      // Получаем информацию о папках из БД (включая is_visible)
      const folderFilterResult = await this.folderFilterService.applyAllFilters(folders, accountId, userId, {
        folderName,
        syncFolders
      });
      
      const foldersToSync = folderFilterResult.foldersToSync;
      if (folderFilterResult.disabledFolders.length > 0) {
        websocketServer.notifySyncStatus(userId, {
          status: 'progress',
          accountId,
          message: `Пропущены отключённые папки: ${folderFilterResult.disabledFolders.join(', ')}`
        });
      }

      // Счётчики синхронизации
      let totalEmails = 0;
      let totalUpdated = 0;
      let totalAttachments = 0;
      let processedEmails = 0;

      // Подсчитываем письма в папках для прогресса
      const emailCounts = await this.imapService.countFolderEmails(imap, foldersToSync, async (accountId, folderName) => {
        return this.persistenceService.getSyncState(accountId, folderName);
      });
      logger.info(`[MailSync] Email counts: ${emailCounts.totalEmails} total, ${emailCounts.newEmails} new`);

      websocketServer.notifySyncStatus(userId, {
        status: 'counting',
        accountId,
        message: `Подсчитано писем: ${emailCounts.totalEmails}, новых: ${emailCounts.newEmails}`,
        folderCounts: emailCounts.folderCounts
      });

      // Синхронизируем каждую папку
      for (const folder of foldersToSync) {
        try {
          const folderTotal = emailCounts.folderCounts.find(fc => fc.name === folder.name)?.total || 0;
          // Динамический таймаут: база + (кол-во писем / 1000 * коэффициент)
          const folderSyncTimeout = this.baseFolderSyncTimeout +
            Math.ceil(folderTotal / 1000) * this.timeoutPer1000Emails;
          const fetchTimeout = this.baseFetchMessagesTimeout +
            Math.ceil(folderTotal / 1000) * this.fetchTimeoutPer1000Emails;

          logger.info(`[MailSync] Syncing folder "${folder.name}" (${folder.path}) — ${folderTotal} emails, timeout: ${Math.round(folderSyncTimeout / 1000)}s...`);

          // Передаём таймаут в syncFolder
          const result = await this.withTimeout(
            this.syncFolder(imap, account, folder, fetchTimeout),
            folderSyncTimeout,
            `Folder sync timeout: ${folder.name} (${folderTotal} emails)`
          );
          totalEmails += result.emailsSynced;
          totalUpdated += result.emailsUpdated;
          totalAttachments += result.attachmentsDownloaded;
          processedEmails += result.emailsSynced;

          // Прогресс по реальным письмам
          const progressPercent = emailCounts.newEmails > 0
            ? Math.round((processedEmails / emailCounts.newEmails) * 100)
            : Math.round((processedEmails / Math.max(1, emailCounts.totalEmails)) * 100);

          // Отправляем детальный прогресс
          websocketServer.notifySyncStatus(userId, {
            status: 'progress',
            accountId,
            progress: Math.min(progressPercent, 100),
            message: `Синхронизация ${folder.name}: ${result.emailsSynced} писем`,
            folderName: folder.name,
            folderProgress: folderTotal > 0 ? Math.round((result.emailsSynced / Math.max(1, folderTotal)) * 100) : 0,
            emailsSynced: totalEmails,
            emailsUpdated: totalUpdated,
            attachmentsDownloaded: totalAttachments,
            processedEmails,
            totalEmailsToProcess: emailCounts.newEmails || emailCounts.totalEmails,
            folderCounts: emailCounts.folderCounts
          });

          logger.debug(`[MailSync] Folder "${folder.name}": ${result.emailsSynced} emails, ${result.attachmentsDownloaded} attachments`);
          logger.info(`[MailSync] Folder "${folder.name}" synced successfully`);
        } catch (error) {
          logger.error(`[MailSync] Error syncing folder "${folder.name}":`, error.message);
          websocketServer.notifySyncStatus(userId, {
            status: 'progress',
            accountId,
            progress: Math.round((processedEmails / Math.max(1, emailCounts.newEmails)) * 100),
            message: `Папка ${folder.name} пропущена: ${error.message}`,
            emailsSynced: totalEmails,
            attachmentsDownloaded: totalAttachments,
            processedEmails,
            totalEmailsToProcess: emailCounts.newEmails || emailCounts.totalEmails
          });
        }
      }

      // Обновляем статус аккаунта
      await db.query(
        `UPDATE mail_accounts 
         SET last_sync = CURRENT_TIMESTAMP, 
             last_sync_status = 'completed',
             last_sync_error = NULL,
             sync_errors_count = 0
         WHERE id = $1`,
        [accountId]
      );

      // Обновляем лог синхронизации
      await this.updateSyncLog(syncId, {
        status: 'success',
        emailsSynced: totalEmails,
        emailsUpdated: totalUpdated,
        attachmentsDownloaded: totalAttachments
      });

      // Отправляем уведомление о завершении
      websocketServer.notifySyncStatus(userId, {
        status: 'completed',
        accountId,
        progress: 100,
        message: `Синхронизация завершена: ${totalEmails} писем, ${totalAttachments} вложений`,
        emailsSynced: totalEmails,
        emailsUpdated: totalUpdated,
        attachmentsDownloaded: totalAttachments
      });

      logger.info(`[MailSync] Completed sync for ${account.email}: ${totalEmails} emails, ${totalAttachments} attachments`);

      return {
        success: true,
        message: `Синхронизация завершена`,
        emailsSynced: totalEmails,
        emailsUpdated: totalUpdated,
        attachmentsDownloaded: totalAttachments,
        folderCounts: emailCounts?.folderCounts || []
      };
    } catch (error) {
      logger.error(`[MailSync] Sync error for ${account.email}:`, error.message);

      // Обновляем статус аккаунта
      await db.query(
        `UPDATE mail_accounts 
         SET last_sync_status = 'error',
             last_sync_error = $1,
             sync_errors_count = sync_errors_count + 1
         WHERE id = $2`,
        [error.message, accountId]
      );

      // Обновляем лог синхронизации
      await this.updateSyncLog(syncId, {
        status: 'error',
        errorMessage: error.message
      });

      // Отправляем уведомление об ошибке
      websocketServer.notifySyncStatus(userId, {
        status: 'error',
        accountId,
        message: `Ошибка синхронизации: ${error.message}`
      });

      throw error;
    }
  }

  /**
   * Получить список папок IMAP (делегируется ImapService)
   */
  async getFolders(imap) {
    return this.imapService.getFolders(imap);
  }

  /**
   * Ограничить ожидание промиса таймаутом (делегируется ImapService)
   */
  async withTimeout(promise, timeoutMs, timeoutMessage) {
    return this.imapService.withTimeout(promise, timeoutMs, timeoutMessage);
  }

  /**
   * Синхронизировать конкретную папку
   * @param {object} imap - IMAP подключение
   * @param {object} account - Аккаунт
   * @param {object} folder - Папка
   * @param {number} [fetchTimeout] - Динамический таймаут для fetch (мс)
   */
  async syncFolder(imap, account, folder, fetchTimeout) {
    const syncFolderModule = require('./syncParts/syncFolder');
    return syncFolderModule(this, imap, account, folder, fetchTimeout);
  }

  /**
   * Получить состояние синхронизации папки
   */
  async getSyncState(accountId, folderName) {
    return this.persistenceService.getSyncState(accountId, folderName);
  }

  /**
   * Обновить состояние синхронизации
   */
  async updateSyncState(accountId, folderName, data) {
    return this.persistenceService.updateSyncState(accountId, folderName, data);
  }

  /**
   * Загрузить и обработать письма
   */
  /**
   * Загрузить и обработать письма с оптимизацией
   * 1. Сначала получаем атрибуты (UID, flags)
   * 2. Пропускаем уже существующие UID
   * 3. Для новых качаем только заголовки и текст (без вложений)
   */
  async fetchMessages(imap, uids, account, folder, syncState) {
    return fetchMessagesModule(this, imap, uids, account, folder, syncState);
  }

  /**
   * Получить или создать папку
   * @param {string} accountId - ID аккаунта
   * @param {string} userId - ID пользователя
   * @param {string} folderName - Имя папки (для отображения)
   * @param {string|null} imapFolderPath - Полный путь папки в IMAP (например, "INBOX.Sent")
   * @returns {Promise<Object|null>} Объект папки
   */
  async getOrCreateFolder(accountId, userId, folderName, imapFolderPath = null) {
    const folderType = this.parserService.determineFolderType(folderName);
    return this.persistenceService.getOrCreateFolder(accountId, userId, folderName, folderType, imapFolderPath);
  }

  /**
   * Сохранить вложения (делегируется MailPersistenceService)
   */
  async saveAttachments(attachments, mailId, userId, accountId, folderId, mailInfo = null) {
    return this.persistenceService.saveAttachmentFiles(attachments, mailId, userId, accountId, folderId, mailInfo);
  }

  /**
   * Проверить и удалить письма, которые были удалены на IMAP-сервере
   * Сравнивает UID из локальной БД с существующими UID на сервере
   *
   * @param {string} accountId - ID аккаунта
   * @param {string} folderName - Имя папки
   * @param {number} uidValidity - UIDVALIDITY папки IMAP
   * @returns {Promise<number>} Количество удалённых писем
   */
  async checkAndDeleteRemovedMails(accountId, folderName, uidValidity) {
    const checkModule = require('./syncParts/checkAndDeleteRemovedMails');
    return checkModule(this, accountId, folderName, uidValidity);
  }

  /**
   * On-demand download of attachments for a specific mail
   */
  async downloadAttachmentsForMail(mailId, userId) {
    const downloadModule = require('./syncParts/downloadAttachmentsForMail');
    return downloadModule(this, mailId, userId);
  }

  /**
   * Fetch a specific attachment from IMAP on-demand (light mode support)
   * 
   * @param {string} attachmentId - ID вложения из БД
   * @param {string} userId - ID пользователя
   * @returns {Promise<Object>} { success: boolean, path?: string, error?: string }
   */
  async fetchAttachmentFromImap(attachmentId, userId) {
    const fetchModule = require('./syncParts/fetchAttachmentFromImap');
    return fetchModule(this, attachmentId, userId);
  }

  /**
   * Создать лог синхронизации (делегируется MailPersistenceService)
   */
  async createSyncLog(syncId, accountId, syncType) {
    return this.persistenceService.createSyncLog(syncId, accountId, syncType);
  }

  /**
   * Обновить лог синхронизации (делегируется MailPersistenceService)
   */
  async updateSyncLog(syncId, data) {
    return this.persistenceService.updateSyncLog(syncId, data);
  }
}

// Singleton instance
const instance = new MailSyncService();

// Create a constructor-like factory that returns the singleton when used with `new`,
// and forward property access to the singleton via a Proxy so both patterns work
function MailSyncFactory() {
  return instance;
}

const mailSyncProxy = new Proxy(MailSyncFactory, {
  construct() { return instance; },
  apply() { return instance; },
  get(target, prop, receiver) {
    if (prop in instance) {
      const v = instance[prop];
      return typeof v === 'function' ? v.bind(instance) : v;
    }
    return Reflect.get(target, prop, receiver);
  }
});

module.exports = mailSyncProxy;
// Also expose constructor and instance explicitly
module.exports.Constructor = MailSyncService;
module.exports.instance = instance;

// Экспортируем статический метод getFolderType
module.exports.getFolderTypeStatic = function(folderName) {
  const lowerName = folderName.toLowerCase();
  
  const exactMatches = {
    // Английские
    'inbox': 'inbox',
    'sent': 'sent',
    'sent mail': 'sent',
    'sent items': 'sent',
    'drafts': 'drafts',
    'archive': 'archive',
    'spam': 'spam',
    'junk': 'spam',
    'trash': 'trash',
    'deleted': 'trash',
    // Русские
    'входящие': 'inbox',
    'отправленные': 'sent',
    'отправлен': 'sent',
    'черновики': 'drafts',
    'черновик': 'drafts',
    'архив': 'archive',
    'спам': 'spam',
    'корзина': 'trash',
    'удаленные': 'trash',
    'удален': 'trash'
  };

  if (exactMatches[lowerName]) {
    return exactMatches[lowerName];
  }

  const partialMatches = {
    'inbox': ['inbox', 'входящие', 'in'],
    'sent': ['sent', 'отправлен', 'sended'],
    'drafts': ['draft', 'чернов'],
    'archive': ['archive', 'архив', 'all mail'],
    'spam': ['spam', 'спам', 'junk', 'нежелательные'],
    'trash': ['trash', 'корзин', 'deleted', 'удален']
  };

  for (const [type, keywords] of Object.entries(partialMatches)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return type;
    }
  }

  return 'custom';
};
