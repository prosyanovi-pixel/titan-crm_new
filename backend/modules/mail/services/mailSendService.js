/**
 * Mail Send Service
 * Сервис отправки почты через SMTP
 * 
 * - Отправка через очередь
 * - Повторные попытки при ошибках
 * - Сохранение в "Отправленные"
 */

const db = require('../../../db');
const nodemailer = require('nodemailer');
const connectionManager = require('./mailConnectionManager');
const logger = require('../../../utils/logger');
const { v4: uuidv4 } = require('uuid');
const { decryptPassword } = require('../../../utils/mailCrypto');
const fs = require('fs');
const path = require('path');
const mailConfig = require('../config');
const MailComposer = require('nodemailer/lib/mail-composer');

class MailSendService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../../..', mailConfig.attachments?.uploadDir || 'uploads/mail');
    // Максимальное количество писем за одну итерацию
    this.batchSize = 10;
    // Максимальное количество повторных попыток
    this.maxRetries = 3;
    // Минимальный интервал между попытками (минуты) - чтобы не забанили
    this.minRetryDelay = 5;
    // Максимальный интервал между попытками (минуты)
    this.maxRetryDelay = 60;
  }

  /**
   * Добавить письмо в очередь отправки
   */
  async queueMail(mailData) {
    const {
      accountId,
      userId,
      mailId,
      to,
      cc,
      bcc,
      subject,
      htmlContent,
      textContent,
      attachmentIds
    } = mailData;

    const queueId = `queue_${uuidv4()}`;

    try {
      await db.query(
        `INSERT INTO mail_send_queue (
           id, account_id, user_id, mail_id,
           to_addresses, cc_addresses, bcc_addresses,
           subject, html_content, text_content,
           attachment_ids, status, max_retries
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', $12)`,
        [
          queueId,
          accountId,
          userId,
          mailId,
          Array.isArray(to) ? to : [to],
          cc || null,
          bcc || null,
          subject,
          htmlContent || null,
          textContent || null,
          attachmentIds || null,
          this.maxRetries
        ]
      );

      logger.debug(`[MailSend] Queued email: ${queueId} to ${to}`);

      return { queueId, status: 'queued' };
    } catch (error) {
      logger.error('[MailSend] Error queueing email:', error.message);
      throw error;
    }
  }

  /**
   * Обработать очередь отправки
   */
  async processQueue() {
    const result = {
      sent: 0,
      failed: 0
    };

    // Получаем письма из очереди
    const { rows: queueItems } = await db.query(
      `SELECT * FROM mail_send_queue 
       WHERE status IN ('pending', 'retrying')
         AND scheduled_at <= CURRENT_TIMESTAMP
       ORDER BY created_at ASC
       LIMIT $1`,
      [this.batchSize]
    );

    if (queueItems.length === 0) {
      return result;
    }

    logger.debug(`[MailSend] Processing ${queueItems.length} queued emails`);

    for (const item of queueItems) {
      try {
        await this.sendQueuedMail(item);
        result.sent++;
      } catch (error) {
        logger.error(`[MailSend] Error sending queued email ${item.id}:`, error.message);
        await this.handleSendError(item.id, error);
        result.failed++;
      }
    }

    return result;
  }

  /**
   * Отправить письмо из очереди
   */
  async sendQueuedMail(queueItem) {
    // Defensive: normalize array fields that may come from DB as null/undefined
    const toAddresses = Array.isArray(queueItem.to_addresses)
      ? queueItem.to_addresses.filter(Boolean)
      : [queueItem.to_addresses].filter(Boolean);
    const ccAddresses = Array.isArray(queueItem.cc_addresses)
      ? queueItem.cc_addresses.filter(Boolean)
      : (queueItem.cc_addresses ? [queueItem.cc_addresses] : []);
    const bccAddresses = Array.isArray(queueItem.bcc_addresses)
      ? queueItem.bcc_addresses.filter(Boolean)
      : (queueItem.bcc_addresses ? [queueItem.bcc_addresses] : []);

    if (toAddresses.length === 0) {
      throw new Error('No valid recipients');
    }

    logger.debug(`[MailSend] Sending email ${queueItem.id} to ${toAddresses.join(', ')}`);

    // Получаем аккаунт
    const { rows: accountRows } = await db.query(
      `SELECT * FROM mail_accounts WHERE id = $1`,
      [queueItem.account_id]
    );

    if (accountRows.length === 0) {
      throw new Error('Account not found');
    }

    const account = accountRows[0];
    const password = decryptPassword(account.password_encrypted);

    // Создаём SMTP транспортер
    const transporter = nodemailer.createTransport({
      host: account.smtp_host,
      port: account.smtp_port || 587,
      secure: account.use_tls !== false && account.smtp_port === 465,
      auth: {
        user: account.login || account.email,
        pass: password
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Формируем письмо
    const mailOptions = {
      from: {
        name: account.display_name || account.email,
        address: account.email
      },
      to: toAddresses.join(', '),
      cc: ccAddresses.length > 0 ? ccAddresses.join(', ') : undefined,
      bcc: bccAddresses.length > 0 ? bccAddresses.join(', ') : undefined,
      subject: queueItem.subject,
      html: queueItem.html_content,
      text: queueItem.text_content,
      attachments: []
    };

    // Добавляем вложения
    if (queueItem.attachment_ids && queueItem.attachment_ids.length > 0) {
      const attachments = await this.loadAttachments(queueItem.attachment_ids);
      mailOptions.attachments = attachments;
    }

    // Отправляем
    const info = await transporter.sendMail(mailOptions);

    logger.info(`[MailSend] Email sent: ${info.messageId}`);
    
    // Сохраняем отправленное письмо в папку "Отправленные" IMAP (Sent)
    try {
      const { appendSentToImap } = require('../utils/helpers');
      
      const { rows } = await db.query(
        `SELECT imap_folder_path FROM mail_folders WHERE account_id = $1 AND folder_type = 'sent' LIMIT 1`,
        [queueItem.account_id]
      );
      
      if (rows.length > 0 && rows[0].imap_folder_path) {
        const sentBoxPath = rows[0].imap_folder_path;
        const mailExtracted = Object.assign({}, mailOptions, { messageId: info.messageId });
        const compiledMessage = await new MailComposer(mailExtracted).compile().build();
        
        // Asynchronous append fire-and-forget
        appendSentToImap(queueItem.user_id, queueItem.account_id, compiledMessage, sentBoxPath).catch(err => {
          logger.error(`[MailSend] Failed to append to IMAP silently: ${err.message}`);
        });
      }
    } catch (e) {
      logger.error(`[MailSend] Could not prepare IMAP append: ${e.message}`);
    }

    // Обновляем очередь
    await db.query(
      `UPDATE mail_send_queue 
       SET status = 'sent',
           sent_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [queueItem.id]
    );

    // Если есть mail_id, обновляем папку на "Отправленные"
    if (queueItem.mail_id) {
      await this.moveToSentFolder(queueItem.mail_id, queueItem.account_id);
    }

    return { success: true, messageId: info.messageId };
  }

  /**
   * Загрузить вложения из БД
   */
  async loadAttachments(attachmentIds) {
    const attachments = [];

    for (const attachmentId of attachmentIds) {
      try {
        const { rows } = await db.query(
          `SELECT * FROM mail_attachments WHERE id = $1`,
          [attachmentId]
        );

        if (rows.length === 0) continue;

        const attachment = rows[0];
        const filePath = path.join(this.uploadsDir, attachment.stored_path);

        if (!fs.existsSync(filePath)) {
          logger.warn(`[MailSend] Attachment file not found: ${filePath}`);
          continue;
        }

        attachments.push({
          filename: attachment.filename,
          path: filePath,
          contentType: attachment.content_type
        });
      } catch (error) {
        logger.error(`[MailSend] Error loading attachment ${attachmentId}:`, error.message);
      }
    }

    return attachments;
  }

  /**
   * Переместить письмо в папку "Отправленные"
   */
  async moveToSentFolder(mailId, accountId) {
    try {
      const { rows } = await db.query(
        `SELECT id FROM mail_folders 
         WHERE account_id = $1 AND folder_type = 'sent' 
         LIMIT 1`,
        [accountId]
      );

      if (rows.length > 0) {
        await db.query(
          `UPDATE mail SET folder_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [rows[0].id, mailId]
        );
      }
    } catch (error) {
      logger.error('[MailSend] Error moving to sent folder:', error.message);
    }
  }

  /**
   * Обработать ошибку отправки
   */
  async handleSendError(queueId, error) {
    const { rows } = await db.query(
      `SELECT retry_count, max_retries FROM mail_send_queue WHERE id = $1`,
      [queueId]
    );

    if (rows.length === 0) return;

    const retryCount = Number(rows[0].retry_count) || 0;
    const maxRetries = Number(rows[0].max_retries) || this.maxRetries;
    const newRetryCount = retryCount + 1;

    if (newRetryCount >= maxRetries) {
      // Превышено количество попыток - отмечаем как failed
      await db.query(
        `UPDATE mail_send_queue
         SET status = 'failed',
             error_message = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [error.message, queueId]
      );

      logger.error(`[MailSend] Email ${queueId} FAILED after ${newRetryCount} retries. Final error: ${error.message}`);
    } else {
      // Планируем повторную попытку с линейной задержкой (5, 10, 15 минут)
      const delayMinutes = Math.min(
        this.minRetryDelay * newRetryCount,
        this.maxRetryDelay
      );

      await db.query(
        `UPDATE mail_send_queue
         SET status = 'retrying',
             retry_count = $1,
             error_message = $2,
             scheduled_at = CURRENT_TIMESTAMP + ($3 * INTERVAL '1 minute'),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [newRetryCount, error.message, delayMinutes, queueId]
      );

      logger.info(`[MailSend] Email ${queueId} scheduled for retry #${newRetryCount} in ${delayMinutes} minutes (max: ${maxRetries})`);
    }
  }

  /**
   * Отправить письмо немедленно (без очереди)
   */
  async sendMailImmediately(mailData) {
    const queueResult = await this.queueMail(mailData);
    return await this.sendQueuedMail({
      id: queueResult.queueId,
      ...mailData,
      to_addresses: Array.isArray(mailData.to) ? mailData.to : [mailData.to],
      cc_addresses: mailData.cc,
      bcc_addresses: mailData.bcc,
      html_content: mailData.htmlContent,
      text_content: mailData.textContent,
      attachment_ids: mailData.attachmentIds,
      retry_count: 0,
      max_retries: this.maxRetries
    });
  }

  /**
   * Получить статус очереди
   */
  async getQueueStatus() {
    const { rows } = await db.query(
      `SELECT 
         status,
         COUNT(*) as count,
         MIN(scheduled_at) as oldest
       FROM mail_send_queue
       GROUP BY status`
    );

    return rows;
  }
}

// Singleton instance
const instance = new MailSendService();

module.exports = instance;
