const db = require('../../../../db');
const helpers = require('../utils/helpers');
const path = require('path');
const fs = require('fs');
const logger = require('../../../../utils/logger');

module.exports = async function fetchAttachmentFromImap(instance, attachmentId, userId) {
  try {
    logger.info(`[AttachmentFetch] Fetching attachment ${attachmentId} for userId=${userId}`);

    const { rows: attachmentRows } = await db.query(
      `SELECT ma.*, m.id as mail_id, m.imap_uid, m.subject, m.sender as sender,
              m.created_at, m.folder_id, m.account_id,
              f.imap_folder_path, f.folder_name, f.account_id as folder_account_id
       FROM mail_attachments ma
       INNER JOIN mail m ON ma.mail_id = m.id
       LEFT JOIN mail_folders f ON m.folder_id = f.id
       WHERE ma.id = $1 AND m.user_id = $2`,
      [attachmentId, userId]
    );

    logger.info(`[AttachmentFetch] Found ${attachmentRows.length} rows for attachment ${attachmentId}`);

    if (attachmentRows.length === 0) {
      logger.warn(`[AttachmentFetch] Attachment not found: ${attachmentId} (userId=${userId})`);
      return { success: false, error: 'Attachment not found' };
    }

    const attachment = attachmentRows[0];
    const mailId = attachment.mailId || attachment.mail_id;
    const imapUid = attachment.imapUid || attachment.imap_uid;

    const accountId = attachment.accountId || attachment.account_id || attachment.folderAccountId || attachment.folder_account_id;
    if (!accountId) {
      logger.error(`[AttachmentFetch] No account_id for attachment ${attachmentId}`);
      return { success: false, error: 'Account not found - mail has no account association' };
    }

    const account = await helpers.requireAccount(accountId, userId);
    if (!account) {
      logger.error(`[AttachmentFetch] Account ${accountId} not found for attachment ${attachmentId}`);
      return { success: false, error: 'Account not found' };
    }

    if (!imapUid) {
      logger.error(`[AttachmentFetch] No IMAP UID for mail ${mailId}`);
      return { success: false, error: 'Cannot fetch attachment: no IMAP UID' };
    }

    const connectionManager = require('../mailConnectionManager');
    const imap = await connectionManager.getImapConnection(account);
    const folderHelpers = require('./folderHelpers');
    const folderPath = folderHelpers.resolveFolderPathFromMail(attachment);

    logger.info(`[AttachmentFetch] Fetching attachment ${attachmentId} (${attachment.filename || attachment.fileName}) from IMAP...`);
    logger.info(`[AttachmentFetch] Folder: ${folderPath}, UID: ${imapUid}`);

    await folderHelpers.openBox(imap, folderPath, true);

    return new Promise((resolve, reject) => {
      const fetch = imap.fetch(imapUid, { 
        bodies: [''], 
        markSeen: false,
        struct: true
      });

      let foundAttachment = null;
      let finalStoredPath = null;
      let responseMessage = '';
      let messageFound = false;
      const messagePromises = [];

      fetch.on('message', (msg) => {
        messageFound = true;
        const msgPromise = new Promise((resolveMsg) => {
          const chunks = [];

          msg.on('body', (stream) => {
            stream.on('data', chunk => chunks.push(chunk));
            stream.on('error', (err) => {
              logger.error(`[AttachmentFetch] Stream error:`, err.message);
              resolveMsg();
            });
          });

          msg.once('end', async () => {
            try {
              const buffer = Buffer.concat(chunks);
              const { simpleParser } = require('mailparser');
              const parsed = await simpleParser(buffer);

              if (parsed.attachments && parsed.attachments.length > 0) {
                logger.info(`[AttachmentFetch] Parsed ${parsed.attachments.length} attachments from IMAP message`);
                for (const att of parsed.attachments) {
                  const attFilename = String(att.filename || att.name || '').trim();
                  const dbFilename = String(attachment.fileName || attachment.filename || '').trim();
                  const normalize = (name) => name.toLowerCase()
                    .replace(/\s*\(conflicted copy.*\)/gi, '')
                    .replace(/\s+/g, ' ')
                    .trim();
                  const attNormalized = normalize(attFilename);
                  const dbNormalized = normalize(dbFilename);
                  const exactMatch = attFilename === dbFilename;
                  const normalizedMatch = attNormalized === dbNormalized;
                  const attachmentSize = attachment.fileSize || attachment.file_size;
                  const sizeMatches = !attachmentSize || att.size === Number(attachmentSize);

                  logger.info(`[AttachmentFetch] Comparing attachment: "${attFilename}" with DB: "${dbFilename}", exact: ${exactMatch}, normalized: ${normalizedMatch}, sizeMatches: ${sizeMatches}`);

                  if ((exactMatch || normalizedMatch) && sizeMatches) {
                    logger.info(`[AttachmentFetch] Found matching attachment: ${attFilename}`);
                    foundAttachment = att;
                    break;
                  }
                }
              } else {
                logger.warn(`[AttachmentFetch] No attachments found in parsed message`);
              }

              if (foundAttachment && foundAttachment.content) {
                const mailInfo = {
                  folderName: attachment.folderName || attachment.folder_name,
                  subject: attachment.subject,
                  date: attachment.createdAt || attachment.created_at,
                  sender: attachment.sender
                };

                const { storedPath } = helpers.buildAttachmentPath(
                  account.id,
                  attachment.folderId || attachment.folder_id,
                  mailId,
                  attachment.fileName || attachment.filename,
                  mailInfo
                );

                const filepath = path.join(instance.uploadsDir, storedPath);
                const dir = path.dirname(filepath);
                if (!fs.existsSync(dir)) {
                  fs.mkdirSync(dir, { recursive: true });
                }

                const writeStream = fs.createWriteStream(filepath);
                if (typeof foundAttachment.content.pipe === 'function') {
                  foundAttachment.content.pipe(writeStream);
                } else {
                  writeStream.write(foundAttachment.content);
                  writeStream.end();
                }

                await new Promise((resolveWrite, rejectWrite) => {
                  writeStream.on('finish', resolveWrite);
                  writeStream.on('error', rejectWrite);
                });

                if (!fs.existsSync(filepath)) {
                  logger.error(`[AttachmentFetch] File not created at ${filepath}`);
                  resolveMsg();
                  return;
                }

                await db.query(
                  'UPDATE mail_attachments SET stored_path = $1, downloaded_at = CURRENT_TIMESTAMP WHERE id = $2',
                  [storedPath, attachmentId]
                );

                finalStoredPath = storedPath;
                responseMessage = `Attachment ${attachment.fileName || attachment.filename} fetched successfully`;
                logger.info(`[AttachmentFetch] Successfully saved attachment to ${filepath}`);
              } else {
                logger.warn(`[AttachmentFetch] Attachment not found in parsed message or has no content`);
              }
            } catch (err) {
              logger.error(`[AttachmentFetch] Error parsing message:`, err.message);
              logger.error(`[AttachmentFetch] Stack:`, err.stack);
            } finally {
              resolveMsg();
            }
          });
        });

        messagePromises.push(msgPromise);
      });

      fetch.once('error', (err) => {
        logger.error(`[AttachmentFetch] Fetch error:`, err.message);
        reject(err);
      });

      fetch.once('end', async () => {
        await Promise.all(messagePromises);

        if (!messageFound) {
          resolve({ 
            success: false, 
            error: `Письмо ${imapUid} не найдено на сервере в папке ${folderPath}. Возможно, оно было перемещено или удалено.`
          });
          return;
        }

        if (foundAttachment && foundAttachment.content && finalStoredPath) {
          resolve({ 
            success: true, 
            path: finalStoredPath,
            message: responseMessage || 'Attachment fetched successfully'
          });
        } else {
          resolve({ 
            success: false, 
            error: 'Attachment not found in message or has no content' 
          });
        }
      });
    });

  } catch (error) {
    logger.error(`[AttachmentFetch] Error fetching attachment ${attachmentId}:`, error.message);
    logger.error(`[AttachmentFetch] Stack:`, error.stack);
    return { 
      success: false, 
      error: `Failed to fetch attachment: ${error.message}` 
    };
  }
};
