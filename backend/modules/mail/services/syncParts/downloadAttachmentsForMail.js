const db = require('../../../../db');
const connectionManager = require('../mailConnectionManager');
const logger = require('../../../../utils/logger');

module.exports = async function downloadAttachmentsForMail(instance, mailId, userId) {
  const { rows: mailRows } = await db.query(
    `SELECT m.*, f.imap_folder_path, f.folder_name, f.account_id as folder_account_id
       FROM mail m
       LEFT JOIN mail_folders f ON m.folder_id = f.id
       WHERE m.id = $1 AND m.user_id = $2`,
    [mailId, userId]
  );

  if (mailRows.length === 0) return 0;
  const mail = mailRows[0];
  if (!mail.imap_uid) return 0;

  const helpers = require('../utils/helpers');
  const accountId = mail.account_id || mail.folder_account_id;
  const account = await helpers.requireAccount(accountId, userId);
  if (!account) return 0;

  const imap = await connectionManager.getImapConnection(account);
  const folderHelpers = require('./folderHelpers');
  const folderPath = folderHelpers.resolveFolderPathFromMail(mail);
  await folderHelpers.openBox(imap, folderPath, true);

  return new Promise((resolve, reject) => {
    const fetch = imap.fetch(mail.imap_uid, { bodies: [''], markSeen: false });
    let fetchedCount = 0;
    const messagePromises = [];

    fetch.on('message', (msg) => {
      const msgPromise = new Promise((resolveMsg) => {
        const chunks = [];
        msg.on('body', (stream) => {
          stream.on('data', chunk => chunks.push(chunk));
          stream.on('error', (err) => resolveMsg());
        });
        msg.once('end', async () => {
          try {
            const buffer = Buffer.concat(chunks);
            const { simpleParser } = require('mailparser');
            const parsed = await simpleParser(buffer);
            const displayableAttachments = instance.messageProcessingService.filterDisplayableAttachments(parsed.attachments);
            if (displayableAttachments.length > 0) {
              const mailInfo = { folderName: mail.folder_name, subject: mail.subject, date: mail.created_at, sender: mail.sender };
              fetchedCount += await instance.saveAttachments(displayableAttachments, mailId, userId, mail.account_id, mail.folder_id, mailInfo);
              await instance.persistenceService.updateMailAttachmentFlag(mailId, true);
            }
          } catch (err) {
            logger.error('[MailSync] Error parsing manually downloaded mail:', err);
          } finally {
            resolveMsg();
          }
        });
      });
      messagePromises.push(msgPromise);
    });

    fetch.once('error', (err) => reject(err));
    fetch.once('end', async () => {
      await Promise.all(messagePromises);
      logger.info(`[MailSync] Finished on-demand download for email ${mailId}, fetched ${fetchedCount} attachments.`);
      resolve(fetchedCount);
    });
  });
};
