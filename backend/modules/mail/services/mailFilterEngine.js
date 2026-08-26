/**
 * Mail Filter Engine
 * Движок применения фильтров к письмам
 * 
 * Поддерживаемые условия:
 * - from (отправитель)
 * - to (получатель)
 * - subject (тема)
 * - body (тело письма)
 * - has_attachment (наличие вложения)
 * - size (размер)
 * - date (дата)
 * 
 * Операторы:
 * - contains (содержит)
 * - equals (равно)
 * - starts_with (начинается с)
 * - ends_with (заканчивается на)
 * - greater_than (больше)
 * - less_than (меньше)
 * - regex (регулярное выражение)
 * 
 * Действия:
 * - move_to_folder (переместить в папку)
 * - mark_as_read (отметить прочитанным)
 * - mark_as_starred (добавить в избранное)
 * - add_label (добавить метку)
 * - forward (переслать)
 * - delete (удалить)
 */

const db = require('../../../db');
const logger = require('../../../utils/logger');

class MailFilterEngine {
  constructor() {
    // Максимальное количество фильтров для обработки
    this.maxFilters = 100;
    // Таймаут обработки одного фильтра (мс)
    this.filterTimeout = 5000;
  }

  /**
   * Применить фильтры к новому письму
   * @param {Object} mail - Письмо из БД
   * @param {string} accountId - ID аккаунта
   */
  async applyFilters(mail, accountId) {
    try {
      // Получаем активные фильтры для аккаунта
      const filters = await this.getAccountFilters(accountId);
      
      if (filters.length === 0) {
        return { applied: 0, actions: [] };
      }

      logger.debug(`[MailFilter] Applying ${filters.length} filters to mail ${mail.id}`);

      let appliedCount = 0;
      const actions = [];

      for (const filter of filters) {
        try {
          const result = await this.applyFilter(mail, filter);
          if (result.matched) {
            appliedCount++;
            actions.push(...result.actions);
            
            // Если фильтр применяется только один раз
            if (filter.apply_once) {
              break;
            }
          }
        } catch (error) {
          logger.error(`[MailFilter] Error applying filter ${filter.id}:`, error.message);
        }
      }

      if (appliedCount > 0) {
        logger.info(`[MailFilter] Applied ${appliedCount} filter(s) to mail ${mail.id}`);
      }

      return { applied: appliedCount, actions };
    } catch (error) {
      logger.error('[MailFilter] Error applying filters:', error.message);
      return { applied: 0, actions: [] };
    }
  }

  /**
   * Получить активные фильтры для аккаунта
   */
  async getAccountFilters(accountId) {
    try {
      const { rows } = await db.query(
        `SELECT * FROM mail_filters 
         WHERE account_id = $1 AND is_active = TRUE 
         ORDER BY display_order ASC
         LIMIT $2`,
        [accountId, this.maxFilters]
      );

      const filters = [];
      for (const filter of rows) {
        // Получаем условия фильтра
        const conditions = await this.getFilterConditions(filter.id);
        filter.conditions = conditions;
        filters.push(filter);
      }

      return filters;
    } catch (error) {
      logger.error('[MailFilter] Error getting filters:', error.message);
      return [];
    }
  }

  /**
   * Получить условия фильтра
   */
  async getFilterConditions(filterId) {
    try {
      const { rows } = await db.query(
        `SELECT * FROM mail_filter_conditions 
         WHERE filter_id = $1 
         ORDER BY display_order ASC`,
        [filterId]
      );
      return rows;
    } catch (error) {
      logger.error('[MailFilter] Error getting conditions:', error.message);
      return [];
    }
  }

  /**
   * Применить один фильтр к письму
   */
  async applyFilter(mail, filter) {
    const result = {
      matched: false,
      actions: []
    };

    // Проверяем условия
    const matches = await this.checkConditions(mail, filter.conditions, filter.match_type);
    
    if (!matches) {
      return result;
    }

    result.matched = true;

    // Применяем действия
    if (filter.target_folder_id) {
      const action = await this.moveToFolder(mail.id, filter.target_folder_id);
      if (action) result.actions.push(action);
    }

    if (filter.apply_read) {
      const action = await this.markAsRead(mail.id);
      if (action) result.actions.push(action);
    }

    if (filter.apply_star) {
      const action = await this.markAsStarred(mail.id);
      if (action) result.actions.push(action);
    }

    if (filter.apply_label_id) {
      const action = await this.addLabel(mail.id, filter.apply_label_id);
      if (action) result.actions.push(action);
    }

    if (filter.delete_mail) {
      const action = await this.deleteMail(mail.id);
      if (action) result.actions.push(action);
    }

    if (filter.forward_to) {
      const action = await this.forwardMail(mail, filter.forward_to);
      if (action) result.actions.push(action);
    }

    return result;
  }

  /**
   * Проверить условия фильтра
   * @param {Object} mail - Письмо
   * @param {Array} conditions - Условия
   * @param {string} matchType - 'all' или 'any'
   */
  async checkConditions(mail, conditions, matchType) {
    if (!conditions || conditions.length === 0) {
      return false;
    }

    const results = [];

    for (const condition of conditions) {
      try {
        const matches = await this.checkCondition(mail, condition);
        results.push(matches);
      } catch (error) {
        logger.error(`[MailFilter] Error checking condition:`, error.message);
        results.push(false);
      }
    }

    // 'all' - все условия должны совпасть
    if (matchType === 'all') {
      return results.every(r => r === true);
    }
    
    // 'any' - хотя бы одно условие должно совпасть
    return results.some(r => r === true);
  }

  /**
   * Проверить одно условие
   */
  async checkCondition(mail, condition) {
    const { condition_type, operator, condition_value, is_regex } = condition;

    // Получаем значение поля из письма
    let fieldValue = this.getFieldValue(mail, condition_type);

    // Специальные проверки
    if (condition_type === 'has_attachment') {
      return this.checkHasAttachment(mail, condition_value);
    }

    if (condition_type === 'size') {
      return this.checkSize(mail, operator, parseInt(condition_value));
    }

    if (condition_type === 'date') {
      return this.checkDate(mail, operator, condition_value);
    }

    // Преобразуем в строку
    if (fieldValue === null || fieldValue === undefined) {
      return false;
    }

    fieldValue = String(fieldValue).toLowerCase();
    const searchValue = condition_value.toLowerCase();

    // Проверяем оператор
    switch (operator) {
      case 'contains':
        return fieldValue.includes(searchValue);
      
      case 'equals':
        return fieldValue === searchValue;
      
      case 'starts_with':
        return fieldValue.startsWith(searchValue);
      
      case 'ends_with':
        return fieldValue.endsWith(searchValue);
      
      case 'not_contains':
        return !fieldValue.includes(searchValue);
      
      case 'regex':
        try {
          const regex = new RegExp(condition_value, is_regex ? 'i' : '');
          return regex.test(fieldValue);
        } catch {
          return false;
        }
      
      default:
        return fieldValue.includes(searchValue);
    }
  }

  /**
   * Получить значение поля из письма
   */
  getFieldValue(mail, fieldType) {
    switch (fieldType) {
      case 'from':
      case 'sender':
        return mail.senderEmail || mail.senderemail || mail.sender_email || mail.sender || '';
      
      case 'to':
      case 'recipient':
        return mail.recipientEmail || mail.recipient_email || mail.to || '';
      
      case 'subject':
        return mail.subject || '';
      
      case 'body':
      case 'content':
        return mail.content || mail.htmlContent || mail.html_content || '';
      
      case 'reply_to':
        return mail.inReplyTo || mail.in_reply_to || '';
      
      case 'list_id':
        return mail.listId || mail.list_id || '';
      
      default:
        return '';
    }
  }

  /**
   * Проверка наличия вложений
   */
  checkHasAttachment(mail, expectedValue) {
    const hasAttachments = mail.hasAttachments || mail.has_attachments || false;
    const shouldHave = expectedValue === 'true' || expectedValue === true || expectedValue === '1';
    return hasAttachments === shouldHave;
  }

  /**
   * Проверка размера
   */
  checkSize(mail, operator, expectedSize) {
    // Размер письма примерно равен сумме размеров вложений + размер контента
    const contentSize = (mail.content || '').length + (mail.htmlContent || mail.html_content || '').length;
    const approximateSize = contentSize; // TODO: добавить размер вложений

    switch (operator) {
      case 'greater_than':
        return approximateSize > expectedSize;
      case 'less_than':
        return approximateSize < expectedSize;
      case 'equals':
        return approximateSize === expectedSize;
      default:
        return false;
    }
  }

  /**
   * Проверка даты
   */
  checkDate(mail, operator, dateValue) {
    const mailDate = new Date(mail.date || mail.createdAt || mail.created_at);
    const compareDate = new Date(dateValue);

    if (isNaN(mailDate.getTime()) || isNaN(compareDate.getTime())) {
      return false;
    }

    switch (operator) {
      case 'greater_than':
      case 'after':
        return mailDate > compareDate;
      case 'less_than':
      case 'before':
        return mailDate < compareDate;
      case 'equals':
      case 'on':
        return mailDate.toDateString() === compareDate.toDateString();
      default:
        return false;
    }
  }

  /**
   * Действие: Переместить в папку
   */
  async moveToFolder(mailId, folderId) {
    try {
      await db.query(
        `UPDATE mail SET folder_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [folderId, mailId]
      );
      
      logger.debug(`[MailFilter] Moved mail ${mailId} to folder ${folderId}`);
      
      return {
        type: 'move_to_folder',
        mailId,
        folderId,
        success: true
      };
    } catch (error) {
      logger.error('[MailFilter] Error moving to folder:', error.message);
      return null;
    }
  }

  /**
   * Действие: Отметить как прочитанное
   */
  async markAsRead(mailId) {
    try {
      await db.query(
        `UPDATE mail SET read = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [mailId]
      );
      
      logger.debug(`[MailFilter] Marked mail ${mailId} as read`);
      
      return {
        type: 'mark_as_read',
        mailId,
        success: true
      };
    } catch (error) {
      logger.error('[MailFilter] Error marking as read:', error.message);
      return null;
    }
  }

  /**
   * Действие: Добавить в избранное
   */
  async markAsStarred(mailId) {
    try {
      await db.query(
        `UPDATE mail SET is_starred = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [mailId]
      );
      
      logger.debug(`[MailFilter] Marked mail ${mailId} as starred`);
      
      return {
        type: 'mark_as_starred',
        mailId,
        success: true
      };
    } catch (error) {
      logger.error('[MailFilter] Error marking as starred:', error.message);
      return null;
    }
  }

  /**
   * Действие: Добавить метку
   */
  async addLabel(mailId, labelId) {
    try {
      await db.query(
        `INSERT INTO mail_labels_mapping (mail_id, label_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [mailId, labelId]
      );
      
      logger.debug(`[MailFilter] Added label ${labelId} to mail ${mailId}`);
      
      return {
        type: 'add_label',
        mailId,
        labelId,
        success: true
      };
    } catch (error) {
      logger.error('[MailFilter] Error adding label:', error.message);
      return null;
    }
  }

  /**
   * Действие: Удалить письмо
   */
  async deleteMail(mailId) {
    try {
      // Помечаем как удалённое (перемещаем в Trash)
      const { rows } = await db.query(
        `SELECT id FROM mail_folders WHERE folder_type = 'trash' LIMIT 1`
      );
      
      if (rows.length > 0) {
        await this.moveToFolder(mailId, rows[0].id);
        
        return {
          type: 'delete',
          mailId,
          success: true
        };
      }
      
      return null;
    } catch (error) {
      logger.error('[MailFilter] Error deleting mail:', error.message);
      return null;
    }
  }

  /**
   * Действие: Переслать письмо
   */
  async forwardMail(mail, forwardTo) {
    try {
      // Добавляем в очередь отправки
      const { rows: accountRows } = await db.query(
        `SELECT account_id FROM mail WHERE id = $1`,
        [mail.id]
      );

      if (accountRows.length === 0) return null;

      const queueId = `fwd_${Date.now()}`;
      
      await db.query(
        `INSERT INTO mail_send_queue 
         (id, account_id, mail_id, to_addresses, subject, html_content, text_content, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
        [
          queueId,
          accountRows[0].account_id,
          null,
          [forwardTo],
          `Fwd: ${mail.subject}`,
          mail.html_content || null,
          mail.content || null
        ]
      );

      logger.debug(`[MailFilter] Queued forward of mail ${mail.id} to ${forwardTo}`);
      
      return {
        type: 'forward',
        mailId: mail.id,
        forwardTo,
        queueId,
        success: true
      };
    } catch (error) {
      logger.error('[MailFilter] Error forwarding mail:', error.message);
      return null;
    }
  }

  /**
   * Применить фильтры к существующим письмам (массовое применение)
   */
  async applyFiltersToExistingMails(accountId, options = {}) {
    const { limit = 1000, dryRun = false } = options;

    try {
      const filters = await this.getAccountFilters(accountId);
      
      if (filters.length === 0) {
        return { processed: 0, matched: 0, actions: [] };
      }

      // Получаем письма аккаунта
      const { rows: mails } = await db.query(
        `SELECT * FROM mail 
         WHERE account_id = $1 
         ORDER BY date DESC 
         LIMIT $2`,
        [accountId, limit]
      );

      let matchedCount = 0;
      const allActions = [];

      for (const mail of mails) {
        for (const filter of filters) {
          const result = await this.applyFilter(mail, filter);
          
          if (result.matched) {
            matchedCount++;
            allActions.push(...result.actions);

            if (filter.apply_once) break;
          }
        }
      }

      logger.info(`[MailFilter] Applied filters to ${mails.length} mails, ${matchedCount} matched`);

      return {
        processed: mails.length,
        matched: matchedCount,
        actions: allActions
      };
    } catch (error) {
      logger.error('[MailFilter] Error applying to existing mails:', error.message);
      return { processed: 0, matched: 0, actions: [] };
    }
  }
}

// Singleton instance
const instance = new MailFilterEngine();

module.exports = instance;
