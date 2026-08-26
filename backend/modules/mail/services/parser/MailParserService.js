/**
 * Mail Parser Service
 * Парсинг MIME сообщений и извлечение данных писем
 */

const logger = require('../../../../utils/logger');
const mailConfig = require('../../config');

class MailParserService {
  constructor() {
    this.maxAttachmentSize = mailConfig.attachments.maxSize;
    this.syncMode = mailConfig.syncMode;
  }

  /**
   * Безопасная обрезка строк
   */
  safeTruncate(value, maxLength, fallback = '') {
    if (value === null || value === undefined) {
      return fallback;
    }

    const normalized = String(value);
    return normalized.length > maxLength
      ? normalized.substring(0, maxLength)
      : normalized;
  }

  /**
   * Нормализировать дату
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
   * Проверить, можно ли отобразить вложение
   */
  isDisplayableAttachment(attachment) {
    if (!attachment || !attachment.content) {
      return false;
    }

    const disposition = String(attachment.contentDisposition || '').toLowerCase();
    const contentType = String(attachment.contentType || '').toLowerCase();
    const hasContentId = Boolean(attachment.contentId || attachment.cid);
    const filename = String(attachment.filename || attachment.name || attachment.path || '').trim();

    // Исключаем встроенные картинки подписей (inline images)
    if (disposition === 'inline' && hasContentId && contentType.startsWith('image/')) {
      return false;
    }

    // Нужен хотя бы какой-то идентификатор файла
    return filename.length > 0 || disposition === 'attachment';
  }

  /**
   * Фильтровать displayable вложения
   */
  filterDisplayableAttachments(attachments) {
    if (!Array.isArray(attachments)) {
      return [];
    }

    return attachments.filter((attachment) => this.isDisplayableAttachment(attachment));
  }

  /**
   * Извлечь контент письма
   */
  extractMailContent(parsed) {
    let textContent = parsed.text || parsed.textAsHtml || '';
    let htmlContent = parsed.html || '';

    // Конвертировать Buffer если нужно
    if (Buffer.isBuffer(textContent)) textContent = textContent.toString('utf8');
    if (Buffer.isBuffer(htmlContent)) htmlContent = htmlContent.toString('utf8');

    // Если нет text/plain, извлечь из HTML
    if ((!textContent || textContent.trim().length === 0) && htmlContent && htmlContent.trim().length > 0) {
      try {
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
        logger.error('[MailParser] Error extracting text from HTML:', error.message);
      }
    }
    
    if (!htmlContent && textContent) {
      htmlContent = null;
    }
    
    const isHtml = htmlContent && htmlContent.length > 0;

    return {
      textContent,
      htmlContent: isHtml ? htmlContent : null,
      isHtml
    };
  }

  /**
   * Подготовить данные письма к сохранению
   */
  prepareMailData(parsed, uid) {
    const { textContent, htmlContent, isHtml } = this.extractMailContent(parsed);
    
    const subject = this.safeTruncate(parsed.subject || '', 255);
    const sender = this.safeTruncate(
      parsed.from?.text || parsed.from?.value?.[0]?.name || '',
      255
    );
    const senderEmail = this.safeTruncate(parsed.from?.value?.[0]?.address || '', 255);
    const messageId = this.safeTruncate(parsed.messageId || `generated_${uid}`, 500);
    const dateValue = this.safeTruncate(this.normalizeDateValue(parsed.date), 50);
    const inReplyTo = this.safeTruncate(parsed.inReplyTo || null, 500, null);
    const isRead = Boolean(
      parsed.flags?.seen ||
      (Array.isArray(parsed.flags) && parsed.flags.includes('\\Seen')) ||
      (Array.isArray(parsed.flags?.raw) && parsed.flags.raw.includes('\\Seen'))
    );

    return {
      subject,
      sender,
      senderEmail,
      content: textContent,
      htmlContent,
      date: dateValue,
      isRead,
      messageId,
      inReplyTo,
      references: Array.isArray(parsed.references)
        ? parsed.references.join(' ')
        : (parsed.references || null)
    };
  }

  /**
   * Получить тип папки по имени
   */
  determineFolderType(folderName) {
    const lowerName = String(folderName || '').toLowerCase();
    
    const exactMatches = {
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
  }

  /**
   * Валидировать attachments перед сохранением
   */
  validateAttachments(attachments) {
    if (!Array.isArray(attachments)) {
      return [];
    }

    return attachments.filter(att => {
      if (!att || !att.content) {
        return false;
      }

      const size = Number(att.size);
      if (Number.isFinite(size) && size > this.maxAttachmentSize) {
        logger.warn(`[MailParser] Skipping large attachment: ${att.filename || att.name || '(unnamed)'} (${size} bytes)`);
        return false;
      }

      return true;
    });
  }
}

module.exports = MailParserService;
