const db = require('../../../../db');
const logger = require('../../../../utils/logger');

module.exports = async function checkAndDeleteRemovedMails(instance, accountId, folderName, uidValidity) {
  try {
    const { rows: localMails } = await db.query(
      `SELECT m.id, m.imap_uid
         FROM mail m
         INNER JOIN mail_folders f ON m.folder_id = f.id
         WHERE m.account_id = $1 AND f.folder_name = $2 AND m.imap_uid IS NOT NULL`,
      [accountId, folderName]
    );

    if (localMails.length === 0) return 0;

    const connectionManager = require('../mailConnectionManager');
    const accountRes = await db.query('SELECT * FROM mail_accounts WHERE id = $1', [accountId]);
    if (accountRes.rows.length === 0) {
      logger.warn(`[MailSync] Account ${accountId} not found for deleted mail check`);
      return 0;
    }

    const imap = await connectionManager.getImapConnection(accountRes.rows[0]);

    const serverUids = await new Promise((resolve, reject) => {
      imap.search(['ALL'], (err, results) => {
        if (err) {
          logger.error(`[MailSync] Error searching IMAP for deleted check: ${err.message}`);
          return reject(err);
        }
        resolve(results || []);
      });
    });

    const serverUidSet = new Set(serverUids.map(uid => String(uid)));

    const deletedUids = [];
    for (const localMail of localMails) {
      const localUid = String(localMail.imap_uid);
      if (!serverUidSet.has(localUid)) deletedUids.push(localMail.id);
    }

    if (deletedUids.length > 0) {
      const placeholders = deletedUids.map((_, i) => `$${i + 1}`).join(',');

      await db.query(`DELETE FROM mail_attachments WHERE mail_id IN (${placeholders})`, deletedUids);
      await db.query(`DELETE FROM mail WHERE id IN (${placeholders})`, deletedUids);
      logger.info(`[MailSync] Removed ${deletedUids.length} mails and their attachments deleted from IMAP server`);
    }

    return deletedUids.length;
  } catch (error) {
    logger.error(`[MailSync] Error checking for deleted mails: ${error.message}`);
    return 0;
  }
};
