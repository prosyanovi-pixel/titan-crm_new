const { simpleParser } = require('mailparser');
const db = require('../../../../db');
const logger = require('../../../../utils/logger');

/**
 * Extracted fetchMessages implementation.
 * @param {Object} instance - MailSyncService instance (use instance.persistenceService etc.)
 */
module.exports = async function fetchMessages(instance, imap, uids, account, folder, syncState) {
  const result = {
    emailsSynced: 0,
    emailsUpdated: 0,
    attachmentsDownloaded: 0
  };

  if (!uids || uids.length === 0) return result;

  logger.info(`[MailSync] >>> fetchMessages() OPTIMIZED START: folder=${folder.name}, uids=${uids.length} messages`);

  try {
    // 1. Получаем список уже существующих UID в этой папке из БД
    const existingUids = await instance.persistenceService.getExistingUids(account.id, folder.id);
    logger.debug(`[MailSync] Found ${existingUids.size} existing UIDs in database for folder ${folder.name}`);

    // 2. Запрашиваем атрибуты (flags, UID, struct) для всех сообщений
    const imapHelpers = require('./imapHelpers');
    const attributesMap = await imapHelpers.fetchAttributes(imap, uids);

    const toFetchFull = [];
    const toUpdateFlags = [];

    for (const uid of uids) {
      const uidStr = String(uid);
      const attr = attributesMap.get(uidStr);
      if (!attr) continue;

      const isRead = attr.flags && attr.flags.includes('\\Seen');

      if (existingUids.has(uidStr)) {
        toUpdateFlags.push({ uid, isRead });
      } else {
        toFetchFull.push(uid);
      }
    }

    logger.info(`[MailSync] Sync decision: ${toFetchFull.length} new to download, ${toUpdateFlags.length} existing to check flags`);

    // 3. Обновляем флаги для существующих писем (очень быстро)
    for (const update of toUpdateFlags) {
      try {
        const { rows } = await db.query(
          'SELECT id, read FROM mail WHERE account_id = $1 AND folder_id = $2 AND imap_uid = $3 LIMIT 1',
          [account.id, folder.id, update.uid]
        );
        if (rows.length > 0 && Boolean(rows[0].read) !== update.isRead) {
          await instance.persistenceService.updateMailReadStatus(rows[0].id, update.isRead);
          result.emailsUpdated++;
        }
      } catch (err) {
        logger.error(`[MailSync] Error updating flags for UID ${update.uid}:`, err.message);
      }
    }

    if (toFetchFull.length === 0) {
      logger.info(`[MailSync] No new messages to download in ${folder.name}`);
      return result;
    }

    // 4. Скачиваем контент только для НОВЫХ писем
    const isHeavy = account.syncMode === 'heavy' || account.sync_mode === 'heavy';
    logger.info(`[MailSync] Using ${isHeavy ? 'HEAVY' : 'LIGHT'} sync mode for ${toFetchFull.length} new messages`);

    const imapMessages = await imapHelpers.fetchMessageBuffers(
      imap,
      toFetchFull,
      isHeavy ? { bodies: [''], struct: true, markSeen: false } : { bodies: ['HEADER', 'TEXT'], struct: true, markSeen: false }
    );

    // Process fetched messages
    for (const msgObj of imapMessages) {
      try {
        const { uid: msgUid, flags: msgFlags, parts } = msgObj;

        let fullBuffer;
        if (isHeavy) {
          fullBuffer = parts.get('');
        } else {
          const header = parts.get('HEADER');
          const text = parts.get('TEXT');
          fullBuffer = Buffer.concat([header || Buffer.alloc(0), Buffer.from('\r\n'), text || Buffer.alloc(0)]);
        }

        if (!fullBuffer) {
          logger.warn(`[MailSync] Empty buffer for message UID ${msgUid}`);
          continue;
        }

        const parsed = await simpleParser(fullBuffer);
        parsed.flags = { seen: msgFlags.includes('\\Seen'), raw: msgFlags };

        const processed = await instance.messageProcessingService.processMessage(
          parsed, account, folder, msgUid, isHeavy ? 'heavy' : 'light'
        );

        if (processed) {
          result.emailsSynced++;
          result.attachmentsDownloaded += processed.attachmentsCount;
        }
      } catch (error) {
        logger.error(`[MailSync] Error processing new message ${msgObj.uid}:`, error.message);
      }
    }

    logger.info(`[MailSync] >>> fetchMessages() COMPLETE: synced=${result.emailsSynced}, updated=${result.emailsUpdated}`);
    return result;
  } catch (error) {
    logger.error(`[MailSync] fetchMessages() critical error:`, error.message);
    throw error;
  }
};
