/**
 * Field Name Normalizer
 * Преобразование между snake_case (БД) и camelCase (Node.js объекты)
 */

const logger = require('../../../utils/logger');

/**
 * Маппинг snake_case → camelCase для mail_accounts
 */
const ACCOUNT_FIELD_MAP = {
  // Input (из БД snake_case) → Output (camelCase для API)
  'id': 'id',
  'user_id': 'userId',
  'login': 'login',
  'email': 'email',
  'provider': 'provider',
  'imap_host': 'imapHost',
  'imap_port': 'imapPort',
  'imap_user': 'imapUser',
  'imap_password': 'imapPassword',
  'imap_tls': 'imapTls',
  'smtp_host': 'smtpHost',
  'smtp_port': 'smtpPort',
  'smtp_user': 'smtpUser',
  'smtp_password': 'smtpPassword',
  'smtp_tls': 'smtpTls',
  'is_active': 'isActive',
  'last_sync': 'lastSync',
  'last_sync_status': 'lastSyncStatus',
  'last_sync_error': 'lastSyncError',
  'sync_errors_count': 'syncErrorsCount',
  'created_at': 'createdAt',
  'updated_at': 'updatedAt',
};

/**
 * Маппинг snake_case → camelCase для mail_folders
 */
const FOLDER_FIELD_MAP = {
  'id': 'id',
  'account_id': 'accountId',
  'user_id': 'userId',
  'folder_name': 'folderName',
  'folder_type': 'folderType',
  'parent_folder_id': 'parentFolderId',
  'imap_folder_path': 'imapFolderPath',
  'unseen_count': 'unseenCount',
  'total_count': 'totalCount',
  'display_order': 'displayOrder',
  'is_visible': 'isVisible',
  'created_at': 'createdAt',
  'updated_at': 'updatedAt',
};

/**
 * Маппинг snake_case → camelCase для mail
 */
const MAIL_FIELD_MAP = {
  'id': 'id',
  'user_id': 'userId',
  'account_id': 'accountId',
  'folder_id': 'folderId',
  'message_id': 'messageId',
  'imap_uid': 'imapUid',
  'subject': 'subject',
  'sender': 'sender',
  'senderemail': 'senderEmail',
  'content': 'content',
  'html_content': 'htmlContent',
  'date': 'date',
  'read': 'isRead',
  'is_starred': 'isStarred',
  'has_attachments': 'hasAttachments',
  'in_reply_to': 'inReplyTo',
  'references_header': 'referencesHeader',
  'created_at': 'createdAt',
  'updated_at': 'updatedAt',
};

/**
 * Нормализировать объект из БД (snake_case → camelCase)
 */
function normalizeFromDb(obj, fieldMap = {}) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const normalized = {};
  
  for (const [snakeKey, camelKey] of Object.entries(fieldMap)) {
    if (snakeKey in obj) {
      normalized[camelKey] = obj[snakeKey];
    }
  }
  
  // Возвращаем только сопоставленные поля
  return normalized;
}

/**
 * Денормализировать объект для БД (camelCase → snake_case)
 */
function denormalizeToDb(obj, fieldMap = {}) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const reversed = {};
  for (const [snakeKey, camelKey] of Object.entries(fieldMap)) {
    reversed[camelKey] = snakeKey;
  }

  const denormalized = {};
  
  for (const [camelKey, value] of Object.entries(obj)) {
    const snakeKey = reversed[camelKey] || camelKey;
    denormalized[snakeKey] = value;
  }
  
  return denormalized;
}

/**
 * Нормализировать array объектов
 */
function normalizeArrayFromDb(arr, fieldMap = {}) {
  if (!Array.isArray(arr)) {
    return [];
  }
  
  return arr.map(item => normalizeFromDb(item, fieldMap));
}

/**
 * Валидировать и нормализировать поле folder.path для IMAP
 */
function validateImapPath(folderPath) {
  if (!folderPath) {
    return '';
  }
  
  // Убедимся что это string
  let path = String(folderPath);
  
  // Если всё же пришло число, залогируем
  if (typeof folderPath === 'number') {
    logger.warn(`[FieldNormalizer] Received number as folderPath: ${folderPath}, converted to string`);
  }
  
  return path;
}

/**
 * Валидировать и нормализировать имя папки
 */
function validateFolderName(folderName) {
  if (!folderName) {
    return '';
  }
  
  let name = String(folderName);
  
  if (typeof folderName === 'number') {
    logger.warn(`[FieldNormalizer] Received number as folderName: ${folderName}, converted to string`);
  }
  
  return name.trim();
}

module.exports = {
  ACCOUNT_FIELD_MAP,
  FOLDER_FIELD_MAP,
  MAIL_FIELD_MAP,
  normalizeFromDb,
  denormalizeToDb,
  normalizeArrayFromDb,
  validateImapPath,
  validateFolderName,
};
