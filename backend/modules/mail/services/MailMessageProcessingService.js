/**
 * MailMessageProcessingService
 * Логика обработки отдельного письма (парсинг, сохранение, вложения)
 */

const db = require('../../../db');
const logger = require('../../../utils/logger');
const mailFilterEngine = require('./mailFilterEngine');

class MailMessageProcessingService {
  constructor(persistenceService, parserService = null) {
    this.persistenceService = persistenceService;
    this.parserService = parserService;
  }

  /**
   * Получить или создать папку
   */
  async getOrCreateFolder(accountId, userId, folderName, imapFolderPath = null, attribs = []) {
    let folderType = this.parserService?.determineFolderType?.(folderName) || 'general';
    
    // Если есть атрибуты IMAP, используем их для более точного определения типа
    if (Array.isArray(attribs)) {
      if (attribs.includes('\\Inbox')) folderType = 'inbox';
      else if (attribs.includes('\\Sent')) folderType = 'sent';
      else if (attribs.includes('\\Drafts')) folderType = 'drafts';
      else if (attribs.includes('\\Trash')) folderType = 'trash';
      else if (attribs.includes('\\Spam')) folderType = 'spam';
      else if (attribs.includes('\\Archive') || attribs.includes('\\All')) folderType = 'archive';
    }

    return this.persistenceService.getOrCreateFolder(accountId, userId, folderName, folderType, imapFolderPath);
  }

  /**
   * Проверить является ли вложение пригодным для отображения
   */
  isDisplayableAttachment(attachment) {
    if (!attachment || !attachment.content) {
      return false;
    }

    const disposition = String(attachment.contentDisposition || '').toLowerCase();
    const contentType = String(attachment.contentType || '').toLowerCase();
    const hasContentId = Boolean(attachment.contentId || attachment.cid);
    const filename = String(attachment.filename || attachment.name || attachment.path || '').trim();

    // Исключаем типичные встроенные картинки подписи (cid:inline image)
    if (disposition === 'inline' && hasContentId && contentType.startsWith('image/')) {
      return false;
    }

    // Для отображения в UI нужен хотя бы какой-то идентификатор файла
    return filename.length > 0 || disposition === 'attachment';
  }

  /**
   * Фильтровать вложения
   */
  filterDisplayableAttachments(attachments) {
    if (!Array.isArray(attachments)) {
      return [];
    }

    return attachments.filter((attachment) => this.isDisplayableAttachment(attachment));
  }

  /**
   * Безопасно обрезать строку
   */
  safeTruncate(value, maxLength, fallback = '') {
    if (value === null || value === undefined) {
      return fallback;
    }

    const normalized = this.sanitizeString(String(value));
    return normalized.length > maxLength
      ? normalized.substring(0, maxLength)
      : normalized;
  }

  /**
   * Удалить недопустимые символы (например, нулевые байты) из строки
   */
  sanitizeString(value) {
    return value.replace(/\u0000/g, '');
  }

  /**
   * Нормализовать дату
   */
  normalizeDateValue(value) {
    if (!value) {
      return new Date().toISOString();
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString();
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }

    return String(value);
  }


  /**
   * Обработать одно письмо
   */
  async processMessage(parsed, account, folder, uid, syncMode) {
    const { attachments, ...emailData } = parsed;
    const displayableAttachments = this.filterDisplayableAttachments(attachments);
    const isHeavy = syncMode === 'heavy';
    const isRead = Boolean(emailData.flags?.seen)
      || (Array.isArray(emailData.flags) && emailData.flags.includes('\\Seen'))
      || (Array.isArray(emailData.flags?.raw) && emailData.flags.raw.includes('\\Seen'));

    // Определяем папку в БД
    const folderRecord = await this.getOrCreateFolder(account.id, account.userId, folder.name, folder.path, folder.attribs);

    // Проверяем дубликаты по Message-ID
    const messageId = emailData.messageId || `generated_${uid}`;
    const existing = await db.query(
      `SELECT id FROM mail WHERE message_id = $1 AND account_id = $2 LIMIT 1`,
      [messageId, account.id]
    );

    if (existing.rows.length > 0) {
      const existingMailId = existing.rows[0].id;
      const { rows: existingData } = await db.query(
        'SELECT folder_id, imap_uid FROM mail WHERE id = $1',
        [existingMailId]
      );
      
      const oldFolderId = existingData[0]?.folder_id;
      const oldUid = existingData[0]?.imap_uid;

      // Если папка или UID изменились (письмо перемещено на сервере)
      if (oldFolderId !== folderRecord.id || String(oldUid) !== String(uid)) {
        logger.info(`[MailSync] Reflecting move for message ${messageId}: folder ${oldFolderId} -> ${folderRecord.id}, UID ${oldUid} -> ${uid}`);
        await db.query(
          'UPDATE mail SET folder_id = $1, imap_uid = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
          [folderRecord.id, uid, existingMailId]
        );
      }

      await this.persistenceService.updateMailReadStatus(existingMailId, isRead);
      logger.debug(`[MailSync] Updated status/location for message: ${messageId}`);
      return { isNew: false, attachmentsCount: 0 };
    }

    // Дополнительная проверка по UID (для надёжности)
    const existingByUid = await db.query(
      `SELECT id FROM mail WHERE imap_uid = $1 AND account_id = $2 AND folder_id = $3 LIMIT 1`,
      [uid, account.id, folderRecord.id]
    );

    if (existingByUid.rows.length > 0) {
      await this.persistenceService.updateMailReadStatus(existingByUid.rows[0].id, isRead);
      logger.info(`[MailSync] Skipping duplicate message by UID=${uid} in folder ${folder.name}`);
      return { isNew: false, attachmentsCount: 0 };
    }

    // Обработка содержимого письма
    const { textContent, htmlContent } = this.extractEmailContent(emailData);

    // Создаём запись письма в БД
    const subject = this.safeTruncate(emailData.subject || '', 255);
    const sender = this.safeTruncate(
      emailData.from?.text || emailData.from?.value?.[0]?.name || '',
      255
    );
    const senderEmail = this.safeTruncate(emailData.from?.value?.[0]?.address || '', 255);
    const normalizedMessageId = this.safeTruncate(messageId, 500);
    const dateValue = this.safeTruncate(this.normalizeDateValue(emailData.date), 50);
    const inReplyTo = this.safeTruncate(emailData.inReplyTo || null, 500, null);
    const references = Array.isArray(emailData.references)
      ? emailData.references.join(' ')
      : (emailData.references || null);

    const mailData = {
      subject,
      sender,
      senderEmail,
      content: textContent,
      htmlContent: htmlContent,
      date: dateValue,
      isRead,
      messageId: normalizedMessageId,
      inReplyTo,
      references,
      uid
    };

    const mailId = await this.persistenceService.saveMail(mailData, account, folderRecord);

    // Обрабатываем вложения
    let attachmentsCount = 0;
    if (displayableAttachments.length > 0) {
      attachmentsCount = await this.processAttachments(
        displayableAttachments,
        mailId,
        account,
        folderRecord,
        mailData,
        isHeavy
      );
    } else {
      logger.debug(`[MailSync] No attachments found for message: ${emailData.subject || '(no subject)'}`);
    }

    // Применяем фильтры к новому письму
    await this.applyFilters(emailData, mailId, account.id);

    logger.debug(`[MailSync] Processed message: ${emailData.subject || '(no subject)'}`);

    return {
      isNew: true,
      attachmentsCount
    };
  }

  /**
   * Извлечь содержимое письма из разных источников
   */
  extractEmailContent(emailData) {
    let textContent = emailData.text || emailData.textAsHtml || '';
    let htmlContent = emailData.html || '';

    // Если textContent — это Buffer, конвертируем
    if (Buffer.isBuffer(textContent)) textContent = textContent.toString('utf8');
    if (Buffer.isBuffer(htmlContent)) htmlContent = htmlContent.toString('utf8');

    // Удаляем нулевые байты, чтобы избежать ошибок UTF8 при сохранении в Postgres
    if (typeof textContent === 'string') textContent = this.sanitizeString(textContent);
    if (typeof htmlContent === 'string') htmlContent = this.sanitizeString(htmlContent);

    // Если нет text/plain, пробуем извлечь из text/html
    if ((!textContent || textContent.trim().length === 0) && htmlContent && htmlContent.trim().length > 0) {
      try {
        // Удаляем HTML теги для получения чистого текста
        textContent = htmlContent
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, ' ')
          .trim();
        
        // Обрезаем до разумного размера
        if (textContent.length > 50000) {
          textContent = textContent.substring(0, 50000);
        }
      } catch (error) {
        logger.error('[MailSync] Error extracting text from HTML:', error.message);
      }
    }

    // Если нет HTML, но есть text/plain, используем его
    if (!htmlContent && textContent) {
      htmlContent = null;
    }

    return {
      textContent,
      htmlContent: htmlContent || null
    };
  }

  /**
   * Обработать вложения письма
   */
  async processAttachments(displayableAttachments, mailId, account, folderRecord, mailData, isHeavy) {
    const mailInfo = {
      folderName: folderRecord?.folder_name,
      subject: mailData.subject,
      date: mailData.date,
      sender: mailData.senderEmail || mailData.sender
    };

    let attachmentsCount = 0;

    if (isHeavy) {
      // Heavy mode: скачиваем все вложения на диск
      logger.info(`[MailSync] HEAVY mode — downloading ${displayableAttachments.length} attachments for message: ${mailData.subject || '(no subject)'}`);
      attachmentsCount = await this.persistenceService.saveAttachmentFiles(
        displayableAttachments,
        mailId,
        account.userId,
        account.id,
        folderRecord?.id,
        mailInfo
      );
      logger.info(`[MailSync] Saved ${attachmentsCount}/${displayableAttachments.length} attachments`);
    } else {
      // Light mode: сохраняем только метаданные вложений (без файлов)
      logger.info(`[MailSync] LIGHT mode — saving metadata for ${displayableAttachments.length} attachments`);
      attachmentsCount = await this.persistenceService.saveAttachmentMetadata(displayableAttachments, mailId);
    }

    if (attachmentsCount > 0) {
      await this.persistenceService.updateMailAttachmentFlag(mailId, true);
    }

    return attachmentsCount;
  }

  /**
   * Применить фильтры к письму
   */
  async applyFilters(emailData, mailId, accountId) {
    try {
      const filterResult = await mailFilterEngine.applyFilters(
        { ...emailData, id: mailId, date: emailData.date || new Date() },
        accountId
      );
      
      if (filterResult.applied > 0) {
        logger.debug(`[MailSync] Applied ${filterResult.applied} filter(s) to message ${mailId}`);
      }
    } catch (error) {
      logger.error('[MailSync] Error applying filters:', error.message);
    }
  }
}

module.exports = MailMessageProcessingService;
