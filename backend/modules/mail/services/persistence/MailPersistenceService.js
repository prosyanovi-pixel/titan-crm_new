/**
 * Mail Persistence Service
 * Сохранение и получение данных писем из БД
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../../../../db');
const logger = require('../../../../utils/logger');
const helpers = require('../../utils/helpers');
const path = require('path');
const fs = require('fs');

class MailPersistenceService {
  constructor(uploadsDir, maxAttachmentSize) {
    this.uploadsDir = uploadsDir;
    this.maxAttachmentSize = maxAttachmentSize;
  }

  /**
   * Получить состояние синхронизации папки
   */
  async getSyncState(accountId, folderName) {
    try {
      const { rows } = await db.query(
        'SELECT * FROM mail_sync_state WHERE account_id = $1 AND folder_name = $2 LIMIT 1',
        [accountId, folderName]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('[Persistence] Error getting sync state:', error.message);
      return null;
    }
  }

  /**
   * Обновить состояние синхронизации
   */
  async updateSyncState(accountId, folderName, data) {
    try {
      const id = `sync_state_${uuidv4()}`;
      
      await db.query(
        `INSERT INTO mail_sync_state (id, account_id, folder_name, uid_validity, last_uid, last_sync, sync_status, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
         ON CONFLICT (account_id, folder_name) 
         DO UPDATE SET 
           uid_validity = EXCLUDED.uid_validity,
           last_uid = EXCLUDED.last_uid,
           last_sync = EXCLUDED.last_sync,
           sync_status = EXCLUDED.sync_status,
           updated_at = CURRENT_TIMESTAMP`,
        [
          id,
          accountId,
          folderName,
          data.uid_validity || null,
          data.last_uid || 0,
          data.last_sync || new Date(),
          data.sync_status || 'pending'
        ]
      );
    } catch (error) {
      logger.error('[Persistence] Error updating sync state:', error.message);
    }
  }

  /**
   * Получить список существующих UID для папки
   */
  async getExistingUids(accountId, folderId) {
    try {
      const { rows } = await db.query(
        'SELECT imap_uid FROM mail WHERE account_id = $1 AND folder_id = $2 AND imap_uid IS NOT NULL',
        [accountId, folderId]
      );
      // Возвращаем Set для быстрого поиска
      return new Set(rows.map(row => String(row.imapUid || row.imap_uid)));
    } catch (error) {
      logger.error('[Persistence] Error getting existing UIDs:', error.message);
      return new Set();
    }
  }

  /**
   * Получить или создать папку
   * @param {string} accountId - ID аккаунта
   * @param {string} userId - ID пользователя
   * @param {string} folderName - Имя папки (для отображения)
   * @param {string} folderType - Тип папки (inbox, sent, drafts, spam, trash, archive, custom)
   * @param {string|null} imapFolderPath - Полный путь папки в IMAP (например, "INBOX.Sent")
   * @returns {Promise<Object|null>} Объект папки или null при ошибке
   */
  async getOrCreateFolder(accountId, userId, folderName, folderType = 'custom', imapFolderPath = null) {
    try {
      // Функция для нормализации значений: строки "undefined" и "null" считаем как null
      const normalizeValue = (val) => {
        if (val === undefined || val === null) return null;
        if (typeof val === 'string') {
          const trimmed = val.trim();
          if (trimmed === 'undefined' || trimmed === 'null' || trimmed === '') return null;
          return trimmed;
        }
        return val;
      };
      
      const normalizedFolderName = normalizeValue(folderName);
      const normalizedImapPath = normalizeValue(imapFolderPath);
      
      // Определяем безопасное имя папки: используем нормализованное имя, путь или 'unknown'
      let safeFolderName = normalizedFolderName || normalizedImapPath || 'unknown';
      if (safeFolderName === 'undefined' || safeFolderName === 'null') {
        safeFolderName = 'unknown';
      }
      
      // 1. Сначала пытаемся найти по imap_folder_path
      let rows = [];
      if (normalizedImapPath) {
        rows = (await db.query(
          'SELECT * FROM mail_folders WHERE account_id = $1 AND imap_folder_path = $2 LIMIT 1',
          [accountId, normalizedImapPath]
        )).rows;
      }
      
      // 2. Если не нашли по пути, пробуем найти по folder_type (для системных папок)
      // Это предотвращает дубликаты, когда IMAP путь системной папки отличается от предустановленного
      if (rows.length === 0 && folderType && folderType !== 'custom' && folderType !== 'system' && folderType !== 'general') {
        rows = (await db.query(
          'SELECT * FROM mail_folders WHERE account_id = $1 AND folder_type = $2 LIMIT 1',
          [accountId, folderType]
        )).rows;
        
        if (rows.length > 0) {
          logger.info(`[Persistence] Found existing folder by type="${folderType}" for account ${accountId}. Updating path to "${normalizedImapPath}"`);
        }
      }

      // 3. Если всё ещё не нашли, ищем по имени
      if (rows.length === 0) {
        rows = (await db.query(
          'SELECT * FROM mail_folders WHERE account_id = $1 AND folder_name = $2 LIMIT 1',
          [accountId, safeFolderName]
        )).rows;
      }

      if (rows.length > 0) {
        const folder = rows[0];
        const updates = [];
        const values = [];
        let p = 1;

        // Если у папки не совпадает imap_folder_path - обновляем
        if (normalizedImapPath && folder.imapFolderPath !== normalizedImapPath && folder.imap_folder_path !== normalizedImapPath) {
          updates.push(`imap_folder_path = $${p++}`);
          values.push(normalizedImapPath);
        }

        // Если имя папки отличается (например, Inbox -> Входящие) - обновляем имя
        if (normalizedFolderName && folder.folderName !== normalizedFolderName && folder.folder_name !== normalizedFolderName) {
          updates.push(`folder_name = $${p++}`);
          values.push(normalizedFolderName);
        }

        // Если это системная папка и тип не установлен или не совпадает - обновляем тип
        if (folderType && folderType !== 'custom' && folderType !== 'general' && folder.folderType !== folderType && folder.folder_type !== folderType) {
          updates.push(`folder_type = $${p++}`);
          values.push(folderType);
        }

        if (updates.length > 0) {
          values.push(folder.id);
          await db.query(
            `UPDATE mail_folders SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${p}`,
            values
          );
          // Обновляем объект folder для возврата
          if (normalizedImapPath) folder.imap_folder_path = normalizedImapPath;
          if (normalizedFolderName) folder.folder_name = normalizedFolderName;
          if (folderType) folder.folder_type = folderType;
        }

        return folder;
      }

      // 4. Создаём новую папку
      const folderId = `folder_${uuidv4()}`;
      await db.query(
        `INSERT INTO mail_folders (id, account_id, user_id, folder_name, folder_type, imap_folder_path, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, 999)`,
        [folderId, accountId, userId, safeFolderName, folderType, normalizedImapPath]
      );

      return {
        id: folderId,
        name: safeFolderName,
        folder_type: folderType,
        imap_folder_path: normalizedImapPath,
        account_id: accountId,
        user_id: userId
      };
    } catch (error) {
      logger.error('[Persistence] Error getting/creating folder:', error.message);
      return null;
    }
  }

  /**
   * Сохранить письмо в БД
   */
  async saveMail(mailData, account, folder) {
    const {
      subject, sender, senderEmail, content, htmlContent,
      date, isRead, messageId, inReplyTo, references, uid
    } = mailData;

    const mailId = `mail_${uuidv4()}`;

    try {
      await db.query(
        `INSERT INTO mail (
           id, user_id, account_id, folder_id, message_id, imap_uid,
           subject, sender, senderemail, content, html_content,
           date, read, is_starred, has_attachments,
           in_reply_to, references_header, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, CURRENT_TIMESTAMP)`,
        [
          mailId,
          account.userId,
          account.id,
          folder?.id || null,
          messageId,
          uid,
          subject,
          sender,
          senderEmail,
          content,
          htmlContent,
          date,
          isRead,
          false,
          false,
          inReplyTo,
          references || null
        ]
      );

      // Обновляем счётчики папки, если папка указана
      if (folder?.id) {
        await this.updateFolderCounters(folder.id);
      }

      return mailId;
    } catch (error) {
      logger.error('[Persistence] Error saving mail:', error.message);
      throw error;
    }
  }

  /**
   * Проверить есть ли письмо по message_id
   */
  async getMailByMessageId(messageId, accountId) {
    try {
      const { rows } = await db.query(
        'SELECT id FROM mail WHERE message_id = $1 AND account_id = $2 LIMIT 1',
        [messageId, accountId]
      );
      return rows[0] || null;
    } catch (error) {
      logger.error('[Persistence] Error checking mail:', error.message);
      return null;
    }
  }

  /**
   * Удалить письмо и обновить счётчики папки
   */
  async deleteMail(mailId) {
    try {
      // Получаем folder_id письма перед удалением
      const { rows } = await db.query(
        'SELECT folder_id FROM mail WHERE id = $1',
        [mailId]
      );

      if (rows.length === 0) {
        logger.warn(`[Persistence] Mail ${mailId} not found`);
        return false;
      }

      const folderId = rows[0].folder_id;

      // Удаляем вложения (если есть)
      await db.query('DELETE FROM mail_attachments WHERE mail_id = $1', [mailId]);

      // Удаляем письмо
      await db.query('DELETE FROM mail WHERE id = $1', [mailId]);

      // Обновляем счётчики папки
      if (folderId) {
        await this.updateFolderCounters(folderId);
      }

      logger.debug(`[Persistence] Deleted mail ${mailId}`);
      return true;
    } catch (error) {
      logger.error('[Persistence] Error deleting mail:', error.message);
      return false;
    }
  }

  /**
   * Массовое удаление писем и обновление счётчиков папок
   */
  async deleteMailsBulk(mailIds) {
    if (!mailIds || mailIds.length === 0) {
      return { deleted: 0, foldersUpdated: [] };
    }

    try {
      // Получаем folder_id для каждого письма
      const placeholders = mailIds.map((_, i) => `$${i + 1}`).join(',');
      const { rows } = await db.query(
        `SELECT DISTINCT folder_id FROM mail WHERE id IN (${placeholders})`,
        mailIds
      );

      const folderIds = rows.map(row => row.folder_id).filter(id => id);

      // Удаляем вложения
      await db.query(`DELETE FROM mail_attachments WHERE mail_id IN (${placeholders})`, mailIds);

      // Удаляем письма
      const { rowCount } = await db.query(`DELETE FROM mail WHERE id IN (${placeholders})`, mailIds);

      // Обновляем счётчики для каждой затронутой папки
      const updatedFolders = [];
      for (const folderId of folderIds) {
        await this.updateFolderCounters(folderId);
        updatedFolders.push(folderId);
      }

      logger.debug(`[Persistence] Bulk deleted ${rowCount} mails, updated folders: ${updatedFolders.length}`);
      return { deleted: rowCount, foldersUpdated: updatedFolders };
    } catch (error) {
      logger.error('[Persistence] Error bulk deleting mails:', error.message);
      return { deleted: 0, foldersUpdated: [] };
    }
  }

  /**
   * Сохранить метаданные вложений (light mode)
   */
  async saveAttachmentMetadata(attachments, mailId) {
    let savedCount = 0;

    for (const attachment of attachments) {
      try {
        const attachmentId = `attachment_${uuidv4()}`;
        const rawSize = Number(attachment.size);
        const attachmentSize = Number.isFinite(rawSize) ? rawSize : null;
        const originalName = String(attachment.filename || attachment.name || attachment.path || 'attachment').trim() || 'attachment';

        await db.query(
          `INSERT INTO mail_attachments (id, mail_id, filename, content_type, file_size, stored_path)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            attachmentId,
            mailId,
            originalName.substring(0, 500),
            String(attachment.contentType || 'application/octet-stream').substring(0, 100),
            attachmentSize,
            ''  // файл ещё не скачан
          ]
        );
        savedCount++;
      } catch (error) {
        logger.error('[Persistence] Error saving attachment metadata:', error.message);
      }
    }

    return savedCount;
  }

  /**
   * Сохранить вложения на диск (heavy mode)
   */
  async saveAttachmentFiles(attachments, mailId, userId, accountId, folderId, mailInfo = null) {
    let savedCount = 0;

    for (const attachment of attachments) {
      try {
        if (!attachment.content) {
          logger.warn('[Persistence] No content in attachment:', attachment.filename);
          continue;
        }

        const originalName = String(attachment.filename || attachment.name || 'attachment').trim() || 'attachment';
        const { storedPath } = helpers.buildAttachmentPath(accountId, folderId, mailId, originalName, mailInfo);
        const filepath = path.join(this.uploadsDir, storedPath);

        logger.debug(`[Persistence] Saving attachment: ${originalName} to ${filepath}`);

        const writeStream = fs.createWriteStream(filepath);
        
        if (typeof attachment.content.pipe === 'function') {
          attachment.content.pipe(writeStream);
        } else {
          writeStream.write(attachment.content);
          writeStream.end();
        }

        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });

        if (!fs.existsSync(filepath)) {
          logger.error('[Persistence] File not created:', filepath);
          continue;
        }

        const stats = fs.statSync(filepath);

        await db.query(
          `INSERT INTO mail_attachments (id, mail_id, filename, content_type, file_size, stored_path)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            `attachment_${uuidv4()}`,
            mailId,
            originalName.substring(0, 500),
            String(attachment.contentType || 'application/octet-stream').substring(0, 100),
            stats.size,
            storedPath.substring(0, 500)
          ]
        );

        savedCount++;
      } catch (error) {
        logger.error('[Persistence] Error saving attachment:', error.message);
      }
    }

    return savedCount;
  }

  /**
   * Обновить флаг has_attachments
   */
  async updateMailAttachmentFlag(mailId, hasAttachments = true) {
    try {
      await db.query(
        'UPDATE mail SET has_attachments = $1 WHERE id = $2',
        [hasAttachments, mailId]
      );
    } catch (error) {
      logger.error('[Persistence] Error updating attachment flag:', error.message);
    }
  }

  /**
   * Обновить счётчики папки на основе фактических данных в БД
   */
  async updateFolderCounters(folderId) {
    // Валидация folderId: не должен быть undefined, null, строкой "undefined" или NaN
    if (!folderId || folderId === 'undefined' || folderId === 'null' || (typeof folderId === 'string' && !/^(folder_)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(folderId) && !/^[0-9a-f-]{36}$/i.test(folderId))) {
      logger.warn(`[Persistence] Invalid folderId passed to updateFolderCounters: ${folderId}`);
      return;
    }
    try {
      // Вычисляем общее количество писем и количество непрочитанных в папке
      const { rows } = await db.query(
        `SELECT
          COUNT(*) as total_count,
          COUNT(CASE WHEN read = false THEN 1 END) as unseen_count
         FROM mail
         WHERE folder_id = $1`,
        [folderId]
      );

      if (rows.length > 0) {
        // Due to db.js converting snake_case to camelCase, we need to extract totalCount and unseenCount
        const total = Number(rows[0].totalCount || rows[0].total_count || 0);
        const unseen = Number(rows[0].unseenCount || rows[0].unseen_count || 0);
        await db.query(
          `UPDATE mail_folders
           SET total_count = $1, unseen_count = $2, updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [total, unseen, folderId]
        );
        logger.debug(`[Persistence] Updated folder counters for ${folderId}: total=${total}, unseen=${unseen}`);
      } else {
        // Если писем нет, устанавливаем счётчики в 0
        await db.query(
          `UPDATE mail_folders
           SET total_count = 0, unseen_count = 0, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [folderId]
        );
        logger.debug(`[Persistence] Reset folder counters for ${folderId} (no mails)`);
      }
    } catch (error) {
      logger.error('[Persistence] Error updating folder counters:', error.message);
    }
  }

  /**
   * Обновить статус прочтения письма и счётчики папки
   */
  async updateMailReadStatus(mailId, isRead) {
    try {
      // Получаем folder_id письма
      const { rows } = await db.query(
        'SELECT folder_id FROM mail WHERE id = $1',
        [mailId]
      );

      if (rows.length === 0) {
        logger.warn(`[Persistence] Mail ${mailId} not found`);
        return false;
      }

      const folderId = rows[0].folder_id;

      // Обновляем статус прочтения
      await db.query(
        'UPDATE mail SET read = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [isRead, mailId]
      );

      // Обновляем счётчики папки
      if (folderId) {
        await this.updateFolderCounters(folderId);
      }

      return true;
    } catch (error) {
      logger.error('[Persistence] Error updating mail read status:', error.message);
      return false;
    }
  }

  /**
   * Создать лог синхронизации
   */
  async createSyncLog(syncId, accountId, syncType) {
    try {
      await db.query(
        'INSERT INTO mail_sync_logs (id, account_id, sync_type, status) VALUES ($1, $2, $3, $4)',
        [syncId, accountId, syncType, 'running']
      );
    } catch (error) {
      logger.warn('[Persistence] Failed to create sync log:', error.message);
    }
  }

  /**
   * Обновить лог синхронизации
   */
  async updateSyncLog(syncId, data) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (data.status) {
        fields.push(`status = $${paramCount++}`);
        values.push(data.status);
      }
      if (data.emailsSynced !== undefined) {
        fields.push(`emails_synced = $${paramCount++}`);
        values.push(data.emailsSynced);
      }
      if (data.emailsUpdated !== undefined) {
        fields.push(`emails_updated = $${paramCount++}`);
        values.push(data.emailsUpdated);
      }
      if (data.attachmentsDownloaded !== undefined) {
        fields.push(`attachments_downloaded = $${paramCount++}`);
        values.push(data.attachmentsDownloaded);
      }
      if (data.errorMessage) {
        fields.push(`error_message = $${paramCount++}`);
        values.push(data.errorMessage);
      }

      fields.push(`finished_at = $${paramCount++}`);
      values.push(new Date());

      values.push(syncId);

      const sql = `UPDATE mail_sync_logs SET ${fields.join(', ')} WHERE id = $${paramCount}`;
      await db.query(sql, values);
    } catch (error) {
      logger.warn('[Persistence] Failed to update sync log:', error.message);
    }
  }

  /**
   * Обновить статус аккаунта
   */
  async updateAccountSyncStatus(accountId, status, error = null) {
    try {
      if (error) {
        await db.query(
          `UPDATE mail_accounts 
           SET last_sync = CURRENT_TIMESTAMP, last_sync_status = $1, last_sync_error = $2, sync_errors_count = sync_errors_count + 1
           WHERE id = $3`,
          [status, error, accountId]
        );
      } else {
        await db.query(
          `UPDATE mail_accounts 
           SET last_sync = CURRENT_TIMESTAMP, last_sync_status = $1, last_sync_error = NULL, sync_errors_count = 0
           WHERE id = $2`,
          [status, accountId]
        );
      }
    } catch (error) {
      logger.error('[Persistence] Error updating account status:', error.message);
    }
  }
}

module.exports = MailPersistenceService;
