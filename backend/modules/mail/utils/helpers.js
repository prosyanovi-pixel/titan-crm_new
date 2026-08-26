/**
 * Mail Module Helpers
 * Общие утилиты и вспомогательные функции
 */

const db = require('../../../db');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const mailConfig = require('../config');
const logger = require('../../../utils/logger');

// Маппинг русских/системных названий папок на IMAP-пути (Gmail)
const SYSTEM_FOLDER_IMAP_PATHS = {
  inbox: 'INBOX',
  'входящие': 'INBOX',
  sent: '[Gmail]/Sent Mail',
  'отправленные': '[Gmail]/Sent Mail',
  drafts: '[Gmail]/Drafts',
  'черновики': '[Gmail]/Drafts',
  archive: '[Gmail]/All Mail',
  'архив': '[Gmail]/All Mail',
  spam: '[Gmail]/Spam',
  'спам': '[Gmail]/Spam',
  trash: '[Gmail]/Trash',
  'корзина': '[Gmail]/Trash',
  'удаленные': '[Gmail]/Trash',
};

function resolveImapBoxPath(folderData, account = null) {
  if (!folderData) return 'INBOX';
  
  const isGmail = account && (
    (account.imap_host && account.imap_host.toLowerCase().includes('google')) ||
    (account.email && account.email.toLowerCase().includes('@gmail.com'))
  );

  // 1. Маппинг по типу/названию (для Gmail приоритет выше, так как в БД могут быть локализованные пути, которые ломают openBox)
  const lowerName = (folderData.folder_name || folderData.folderName || '').toLowerCase();
  const folderType = (folderData.folder_type || folderData.folderType || '').toLowerCase();

  const getPath = (key) => {
    let path = SYSTEM_FOLDER_IMAP_PATHS[key];
    if (path && !isGmail && path.startsWith('[Gmail]/')) {
      return path.replace('[Gmail]/', '');
    }
    return path;
  };

  if (isGmail) {
    if (getPath(folderType)) return getPath(folderType);
    if (getPath(lowerName)) return getPath(lowerName);
  }

  // 2. Явный IMAP-путь из БД
  const explicitPath = folderData.imap_folder_path || folderData.imapFolderPath;
  if (explicitPath) return explicitPath;

  // 3. Попробовать по имени (может быть уже IMAP-путь)
  const folderName = folderData.folder_name || folderData.folderName || '';
  if (folderName.toUpperCase() === 'INBOX') return 'INBOX';
  if (folderName.startsWith('[') && folderName.includes(']')) return folderName;

  // 4. Маппинг для не-Gmail или если типы не сработали
  if (getPath(folderType)) return getPath(folderType);
  if (getPath(lowerName)) return getPath(lowerName);

  // 5. Проверка частичного совпадения
  for (const key of Object.keys(SYSTEM_FOLDER_IMAP_PATHS)) {
    if (lowerName.includes(key)) return getPath(key);
  }

  // 6. Фолбэк — имя как есть
  return folderName || 'INBOX';
}


const decodeFilename = (value) => {
  if (!value || typeof value !== 'string') return value;
  if (!/[ÐÑÃ]/.test(value)) return value;
  try {
    return Buffer.from(value, 'latin1').toString('utf8');
  } catch {
    return value;
  }
};

const toCanonicalFolderType = (folderType, folderName) => {
  const type = (folderType || '').toLowerCase();
  if (['inbox', 'sent', 'drafts', 'archive', 'spam', 'trash'].includes(type)) return type;

  const name = (folderName || '').toLowerCase();
  if (name === 'inbox' || name.includes('вход')) return 'inbox';
  if (name === 'sent mail' || name.includes('sent') || name.includes('отправ')) return 'sent';
  if (name === 'drafts' || name.includes('чернов')) return 'drafts';
  if (name === 'archive' || name.includes('архив') || name.includes('all mail')) return 'archive';
  if (name === 'spam' || name.includes('спам')) return 'spam';
  if (name === 'trash' || name.includes('корзин')) return 'trash';

  return null;
};

const normalizeAccount = (raw) => ({
  ...raw,
  user_id: raw.user_id || raw.userId,
  password_encrypted: raw.password_encrypted || raw.passwordEncrypted,
  imap_host: raw.imap_host || raw.imapHost,
  imap_port: raw.imap_port || raw.imapPort,
  smtp_host: raw.smtp_host || raw.smtpHost,
  smtp_port: raw.smtp_port || raw.smtpPort,
  use_tls: raw.use_tls ?? raw.useTls,
  display_name: raw.display_name || raw.displayName,
  account_type: raw.account_type || raw.accountType,
  syncMode: raw.sync_mode || raw.syncMode || 'light',
});

// ---------- DB helpers ----------

async function requireAccount(accountId, userId) {
  const { rows } = await db.query(
    'SELECT * FROM mail_accounts WHERE id = $1 AND user_id = $2',
    [accountId, userId]
  );
  return rows.length ? normalizeAccount(rows[0]) : null;
}

async function getSentFolderId(accountId) {
  const { rows } = await db.query(
    "SELECT id FROM mail_folders WHERE account_id = $1 AND folder_type = 'sent' LIMIT 1",
    [accountId]
  );
  return rows[0]?.id || null;
}

async function getDraftsFolderId(accountId) {
  const { rows } = await db.query(
    "SELECT id FROM mail_folders WHERE account_id = $1 AND folder_type = 'drafts' LIMIT 1",
    [accountId]
  );
  return rows[0]?.id || null;
}

async function applyActualAttachmentFlags(userId, mails) {
  if (!Array.isArray(mails) || mails.length === 0) return mails;

  const ids = mails.map((m) => m?.id).filter(Boolean);
  if (ids.length === 0) return mails;

  const { rows } = await db.query(
    `SELECT
       m.id,
       CASE
         WHEN EXISTS (
           SELECT 1 FROM mail_attachments ma WHERE ma.mail_id = m.id
         ) THEN TRUE
         WHEN m.message_id IS NOT NULL AND EXISTS (
           SELECT 1 FROM mail sibling
           INNER JOIN mail_attachments sma ON sma.mail_id = sibling.id
           WHERE sibling.user_id = m.user_id
             AND sibling.account_id = m.account_id
             AND sibling.message_id = m.message_id
         ) THEN TRUE
         ELSE FALSE
       END AS has_attachments_actual
     FROM mail m
     WHERE m.user_id = $1 AND m.id = ANY($2::varchar[])`,
    [userId, ids]
  );

  const flagById = new Map(rows.map((r) => [r.id, Boolean(r.hasAttachmentsActual ?? r.has_attachments_actual)]));

  return mails.map((mail) => ({
    ...mail,
    hasAttachments: flagById.has(mail.id)
      ? flagById.get(mail.id)
      : Boolean(mail.hasAttachments ?? mail.has_attachments),
  }));
}

// ---------- Upload middleware ----------

const uploadsDir = path.join(__dirname, '../../..', mailConfig.attachments?.uploadDir || 'uploads/mail');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const settings = require('../settings');

// Получить директорию вложений конкретного аккаунта
function getAccountUploadDir(accountId) {
  const dir = path.join(uploadsDir, accountId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Построить структурированный путь для вложения
// Возвращает { storedPath, directory } — относительный путь для БД и абсолютную директорию
function buildAttachmentPath(accountId, folderId, mailId, originalName, mailInfo = null) {
  const storageSettings = settings.attachmentStorage || {};
  const mode = storageSettings.mode || 'structured';
  const preserveName = storageSettings.preserveOriginalName !== false;

  const uuid = crypto.randomUUID();

  let storedPath;
  let directory;

  if (mode === 'structured') {
    // {accountId}/{folderId}/{mailId}/{uuid}_{originalName.ext}
    const ext = preserveName ? path.extname(originalName || '.bin') : path.extname(originalName || '.bin');
    const safeName = preserveName
      ? `${uuid}_${(originalName || 'attachment').replace(/[^a-zA-Z0-9._-\u0400-\u04FF]/g, '_')}`
      : `${uuid}${ext}`;

    if (mailInfo) {
      const safeFolder = (mailInfo.folderName || 'unknown').replace(/[^a-zA-Z0-9.\- \u0400-\u04FF]/g, '_').trim() || 'unknown';
      let dateStr = 'unknown_date';
      if (mailInfo.date) {
        try { dateStr = new Date(mailInfo.date).toISOString().split('T')[0]; } catch(e) {}
      }
      const safeSubject = (mailInfo.subject || 'Без темы').replace(/[^a-zA-Z0-9.\- \u0400-\u04FF]/g, '_').replace(/\s+/g, ' ').trim().substring(0, 50);
      const shortMailId = mailId.substring(0, 8);
      
      const template = mailConfig.attachments?.pathTemplate || '{folderName}/{date}_{subject}_[{mailId}]';
      
      let relativeDir = template
        .replace(/{folderName}/g, safeFolder)
        .replace(/{date}/g, dateStr)
        .replace(/{subject}/g, safeSubject)
        .replace(/{mailId}/g, shortMailId)
        .replace(/{accountId}/g, accountId)
        .replace(/{folderId}/g, folderId || 'unknown');

      // Нормализуем путь (на случай если в шаблоне слэши в другую сторону)
      relativeDir = path.posix.normalize(relativeDir.replace(/\\/g, '/'));

      storedPath = path.posix.join(relativeDir, safeName);
      directory = path.join(uploadsDir, ...relativeDir.split('/'));
    } else {
      storedPath = path.posix.join(accountId, folderId || 'unknown', mailId, safeName);
      directory = path.join(uploadsDir, accountId, folderId || 'unknown', mailId);
    }
  } else {
    // Legacy flat mode
    const ext = path.extname(originalName || '.bin');
    storedPath = `${uuid}${ext}`;
    directory = path.join(uploadsDir, accountId);
  }

  // Создаём директорию
  if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });

  return { storedPath, directory };
}

// Получить абсолютный путь к файлу из storedPath
function resolveAttachmentPath(storedPath) {
  return path.join(uploadsDir, storedPath);
}

// Удалить все вложения аккаунта разом
function deleteAccountAttachments(accountId) {
  const accountDir = path.join(uploadsDir, accountId);
  if (fs.existsSync(accountDir)) {
    fs.rmSync(accountDir, { recursive: true, force: true });
  }
}

// Удалить вложения конкретного письма
function deleteMailAttachments(accountId, folderId, mailId) {
  const mailDir = path.join(uploadsDir, accountId, folderId || 'unknown', mailId);
  if (fs.existsSync(mailDir)) {
    fs.rmSync(mailDir, { recursive: true, force: true });
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

// ---------- System folders ----------

async function createSystemFolders(accountId, userId) {
  const systemFolders = [
    { name: 'Inbox', type: 'inbox', path: 'INBOX', order: 1 }
  ];

  for (const folder of systemFolders) {
    try {
      await db.query(
        `INSERT INTO mail_folders (id, account_id, user_id, folder_name, folder_type, imap_folder_path, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
        [`folder_${uuidv4()}`, accountId, userId, folder.name, folder.type, folder.path, folder.order]
      );
    } catch (error) {
      console.error(`Error creating folder ${folder.name}:`, error);
    }
  }
}

// ---------- IMAP helpers ----------

async function deleteFromImap(userId, accountId, imapUid, boxPath) {
  try {
    const account = await requireAccount(accountId, userId);
    if (!account) {
      logger.warn(`[MailIMAP] Account ${accountId} not found for IMAP delete`);
      return;
    }

    if (!account.imap_host || !account.login || !account.password_encrypted) {
      logger.warn(`[MailIMAP] No IMAP credentials for account ${accountId}, skipping IMAP delete`);
      return;
    }

    const connectionManager = require('../services/mailConnectionManager');
    const imap = await connectionManager.getImapConnection(account);

    const targetBox = boxPath || 'INBOX';

    logger.info(`[MailIMAP] Deleting UID ${imapUid} from ${targetBox} on account ${accountId}`);

    await new Promise((resolve, reject) => {
      imap.openBox(targetBox, false, (err) => {
        if (err) {
          logger.error(`[MailIMAP] Error opening box ${targetBox}: ${err.message}`);
          return reject(err);
        }

        imap.addFlags(imapUid, '\\Deleted', (err) => {
          if (err) {
            logger.error(`[MailIMAP] Failed to mark message ${imapUid} as deleted: ${err.message}`);
            return resolve();
          }

          logger.info(`[MailIMAP] Message ${imapUid} marked as deleted, running expunge...`);

          imap.expunge((err) => {
            if (err) {
              logger.error(`[MailIMAP] Failed to expunge: ${err.message}`);
            } else {
              logger.info(`[MailIMAP] Expunge successful for UID ${imapUid}`);
            }
            resolve();
          });
        });
      });
    });

    logger.info(`[MailIMAP] Deleted message UID ${imapUid} from IMAP account ${accountId}`);
  } catch (error) {
    logger.error(`[MailIMAP] Error deleting from IMAP: ${error.message}`);
  }
}

async function moveOnImap(userId, accountId, imapUid, targetFolder, sourceBoxPath = 'INBOX') {
  try {
    const account = await requireAccount(accountId, userId);
    if (!account) throw new Error('Account not found');

    if (!account.imap_host || !account.login || !account.password_encrypted) {
      logger.warn(`[MailIMAP] No IMAP credentials for account ${accountId}, skipping IMAP move`);
      return false;
    }

    const connectionManager = require('../services/mailConnectionManager');
    const imap = await connectionManager.getImapConnection(account);

    const targetMailbox = targetFolder.imap_folder_path || targetFolder.imapFolderPath || targetFolder.folder_name || targetFolder.folderName || 'INBOX';

    if (sourceBoxPath === targetMailbox) {
      logger.info(`[MailIMAP] Source and target mailbox are the same: ${sourceBoxPath}. Skipping IMAP move.`);
      return true;
    }

    return await new Promise((resolve, reject) => {
      imap.openBox(sourceBoxPath, false, (openErr) => {
        if (openErr) {
          logger.error(`[MailIMAP] Failed to open source box ${sourceBoxPath}: ${openErr.message}`);
          return reject(openErr);
        }

        logger.info(`[MailIMAP] Moving UID ${imapUid} from ${sourceBoxPath} to ${targetMailbox}`);
        console.log(`[MailIMAP] DEBUG: Calling imap.move([${imapUid}], "${targetMailbox}")`);

        imap.move([imapUid], targetMailbox, (err) => {
          if (err) {
            console.log(`[MailIMAP] DEBUG: imap.move FAILED: ${err.message}`);
            logger.warn(`[MailIMAP] IMAP MOVE failed: ${err.message}. Trying copy+delete fallback...`);
            // Fallback: copy + delete
            imap.copy([imapUid], targetMailbox, (copyErr) => {
              if (copyErr) {
                logger.error(`[MailIMAP] Copy failed: ${copyErr.message}`);
                return reject(copyErr);
              }
              imap.addFlags(imapUid, '\\Deleted', (delErr) => {
                if (delErr) logger.warn(`[MailIMAP] Mark deleted after copy failed: ${delErr.message}`);
                imap.expunge((expErr) => {
                  if (expErr) logger.warn(`[MailIMAP] Expunge after copy failed: ${expErr.message}`);
                  resolve(true);
                });
              });
            });
            return;
          }

          // Помечаем как удаленное в исходной папке (некоторые сервера требуют expunge после move)
          imap.addFlags(imapUid, '\\Deleted', (delErr) => {
            imap.expunge((expErr) => {
              resolve(true);
            });
          });
        });
      });
    });
  } catch (error) {
    logger.error(`[MailIMAP] Error moving on IMAP: ${error.message}`);
    throw error;
  }
}

async function setFlagImap(userId, accountId, imapUid, flag, isAdd = true, boxPath = 'INBOX') {
  try {
    const account = await requireAccount(accountId, userId);
    if (!account) return;
    if (!account.imap_host || !account.login || !account.password_encrypted) return;

    const connectionManager = require('../services/mailConnectionManager');
    const imap = await connectionManager.getImapConnection(account);

    await new Promise((resolve, reject) => {
      imap.openBox(boxPath, false, (err) => {
        if (err) return reject(err);

        const callback = (err) => {
          if (err) {
            console.warn(`[MailIMAP] Failed to set flag ${flag} on ${imapUid}:`, err.message);
          } else {
            console.log(`[MailIMAP] Flag ${flag} ${isAdd ? 'added' : 'removed'} on ${imapUid} in ${boxPath}`);
          }
          resolve();
        };

        if (isAdd) {
          imap.addFlags(imapUid, flag, callback);
        } else {
          imap.delFlags(imapUid, flag, callback);
        }
      });
    });
  } catch (error) {
    console.error(`[MailIMAP] Error setting flag on IMAP:`, error.message);
  }
}

/**
 * Обновляет счетчики писем в папке (всего и непрочитанных)
 */
async function updateFolderCounters(folderId) {
  if (!folderId) return;
  try {
    const { rows } = await db.query(
      `SELECT
        COUNT(*) as total_count,
        COUNT(CASE WHEN read = false THEN 1 END) as unseen_count
       FROM mail
       WHERE folder_id = $1`,
      [folderId]
    );

    if (rows.length > 0) {
      const total = parseInt(rows[0].total_count || rows[0].totalCount || 0);
      const unseen = parseInt(rows[0].unseen_count || rows[0].unseenCount || 0);
      await db.query(
        `UPDATE mail_folders
         SET total_count = $1, unseen_count = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [total, unseen, folderId]
      );
      logger.debug(`[Helpers] Updated folder counters for ${folderId}: total=${total}, unseen=${unseen}`);
    }
  } catch (error) {
    logger.error('[Helpers] Error updating folder counters:', error.message);
  }
}

async function appendSentToImap(userId, accountId, rawMimeMessage, sentBoxPath) {
  try {
    const account = await requireAccount(accountId, userId);
    if (!account) return;
    if (!account.imap_host || !account.login || !account.password_encrypted) return;

    const connectionManager = require('../services/mailConnectionManager');
    const imap = await connectionManager.getImapConnection(account);

    await new Promise((resolve, reject) => {
      imap.append(rawMimeMessage, { mailbox: sentBoxPath, flags: ['\\Seen'] }, (err) => {
        if (err) {
          console.error(`[MailIMAP] Failed to append sent message to ${sentBoxPath}:`, err.message);
          return reject(err);
        }
        console.log(`[MailIMAP] Successfully appended sent message to ${sentBoxPath}`);
        resolve();
      });
    });
  } catch (error) {
    console.error(`[MailIMAP] Error appending to IMAP:`, error.message);
  }
}
async function renameImapBox(userId, accountId, oldPath, newPath) {
  try {
    const account = await requireAccount(accountId, userId);
    if (!account) return;
    if (!account.imap_host || !account.login || !account.password_encrypted) return;

    const connectionManager = require('../services/mailConnectionManager');
    const imap = await connectionManager.getImapConnection(account);

    logger.info(`[MailIMAP] Renaming box on server: "${oldPath}" -> "${newPath}"`);

    await new Promise((resolve, reject) => {
      imap.renameBox(oldPath, newPath, (err) => {
        if (err) {
          logger.error(`[MailIMAP] Failed to rename box ${oldPath}: ${err.message}`);
          return reject(err);
        }
        logger.info(`[MailIMAP] Successfully renamed box to ${newPath}`);
        resolve();
      });
    });
  } catch (error) {
    logger.error(`[MailIMAP] Error in renameImapBox: ${error.message}`);
    throw error;
  }
}

module.exports = {
  decodeFilename,
  toCanonicalFolderType,
  normalizeAccount,
  requireAccount,
  getSentFolderId,
  getDraftsFolderId,
  applyActualAttachmentFlags,
  upload,
  uploadsDir,
  getAccountUploadDir,
  buildAttachmentPath,
  resolveAttachmentPath,
  deleteAccountAttachments,
  deleteMailAttachments,
  createSystemFolders,
  deleteFromImap,
  moveOnImap,
  setFlagImap,
  updateFolderCounters,
  appendSentToImap,
  renameImapBox,
  resolveImapBoxPath,
  SYSTEM_FOLDER_IMAP_PATHS,
};
