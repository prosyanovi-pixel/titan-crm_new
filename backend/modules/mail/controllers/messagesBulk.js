/**
 * Mail bulk operations helper
 */

const logger = require('../../../utils/logger');

async function bulkRead({ req, res, db, helpers }) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  const { mailIds, isRead } = req.body;

  try {
    if (!Array.isArray(mailIds) || mailIds.length === 0) {
      return res.status(400).json({ error: 'Mail IDs required' });
    }

    const placeholders = mailIds.map((_, i) => `$${i + 1}`).join(',');
    const { rows: mailRows } = await db.query(
      `SELECT m.id, m.account_id, m.folder_id, m.imap_uid, f.imap_folder_path, f.folder_name, f.folder_type
       FROM mail m
       LEFT JOIN mail_folders f ON f.id = m.folder_id
       WHERE m.id IN (${placeholders}) AND m.user_id = $${mailIds.length + 1}`,
      [...mailIds, userId]
    );

    mailRows.forEach((mail) => {
      const mailImapUid = mail.imapUid || mail.imap_uid;
      const mailAccountId = mail.accountId || mail.account_id;
      if (mailImapUid && mailAccountId) {
        const boxPath = helpers.resolveImapBoxPath({
          imap_folder_path: mail.imapFolderPath || mail.imap_folder_path,
          folder_name: mail.folderName || mail.folder_name,
          folder_type: mail.folderType || mail.folder_type,
        });

        helpers.setFlagImap(userId, mailAccountId, mailImapUid, '\\Seen', isRead, boxPath).catch((error) => {
          logger.error('Error syncing flag to IMAP:', error);
        });
      }
    });

    const query = `UPDATE mail SET read = $${mailIds.length + 1}, updated_at = CURRENT_TIMESTAMP
                   WHERE id IN (${placeholders}) AND user_id = $${mailIds.length + 2}`;
    await db.query(query, [...mailIds, isRead, userId]);

    const uniqueFolderIds = [...new Set(mailRows.map((mail) => mail.folderId || mail.folder_id).filter(Boolean))];
    for (const folderId of uniqueFolderIds) {
      await helpers.updateFolderCounters(folderId);
    }

    res.json({ message: 'Mails updated' });
  } catch (error) {
    logger.error('Error bulk updating mails:', error);
    res.status(500).json({ error: 'Failed to update mails' });
  }
}

async function bulkMove({ req, res, db, helpers, logger }) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  const { mailIds, folderId } = req.body;

  try {
    if (!Array.isArray(mailIds) || mailIds.length === 0 || !folderId) {
      return res.status(400).json({ error: 'Mail IDs and folder ID required' });
    }

    const { rows: targetFolderInfo } = await db.query(
      'SELECT folder_name, imap_folder_path, account_id FROM mail_folders WHERE id = $1 AND user_id = $2',
      [folderId, userId]
    );

    const placeholders = mailIds.map((_, i) => `$${i + 1}`).join(',');
    const { rows: mailRows } = await db.query(
      `SELECT m.id, m.account_id, m.folder_id, m.imap_uid, f.imap_folder_path, f.folder_name, f.folder_type
       FROM mail m
       LEFT JOIN mail_folders f ON f.id = m.folder_id
       WHERE m.id IN (${placeholders}) AND m.user_id = $${mailIds.length + 1}`,
      [...mailIds, userId]
    );

    const { rows: accounts } = await db.query('SELECT * FROM mail_accounts WHERE user_id = $1', [userId]);
    const accountsMap = new Map(accounts.map((account) => [account.id, helpers.normalizeAccount(account)]));

    if (targetFolderInfo.length > 0) {
      const targetFolder = targetFolderInfo[0];
      const targetAccount = accountsMap.get(targetFolder.accountId || targetFolder.account_id);
      const targetBoxPath = helpers.resolveImapBoxPath({
        ...targetFolder,
        imap_folder_path: targetFolder.imapFolderPath || targetFolder.imap_folder_path,
        folder_name: targetFolder.folderName || targetFolder.folder_name,
        folder_type: targetFolder.folderType || targetFolder.folder_type
      }, targetAccount);

      if (targetBoxPath) {
        for (const mail of mailRows) {
          const mailImapUid = mail.imapUid || mail.imap_uid;
          const mailAccountId = mail.accountId || mail.account_id;
          if (mailImapUid && mailAccountId) {
            const mailAccount = accountsMap.get(mailAccountId);
            const sourceBoxPath = helpers.resolveImapBoxPath({
              imap_folder_path: mail.imapFolderPath || mail.imap_folder_path,
              folder_name: mail.folderName || mail.folder_name,
              folder_type: mail.folderType || mail.folder_type,
            }, mailAccount);

            if (mailAccountId === (targetFolder.accountId || targetFolder.account_id)) {
              helpers.moveOnImap(userId, mailAccountId, mailImapUid, { 
                ...targetFolder, 
                imap_folder_path: targetBoxPath,
                folder_name: targetFolder.folderName || targetFolder.folder_name,
                folder_type: targetFolder.folderType || targetFolder.folder_type
              }, sourceBoxPath).catch((error) => {
                logger.error(`[MailBulkMove] Error syncing move to IMAP for mail ${mail.id}:`, error);
              });
            }
          }
        }
      }
    }

    const query = `UPDATE mail SET folder_id = $${mailIds.length + 1}, imap_uid = NULL, updated_at = CURRENT_TIMESTAMP
                   WHERE id IN (${placeholders}) AND user_id = $${mailIds.length + 2}`;
    await db.query(query, [...mailIds, folderId, userId]);

    const uniqueSourceFolderIds = [...new Set(mailRows.map((mail) => mail.folderId || mail.folder_id).filter(Boolean))];
    for (const sourceFolderId of uniqueSourceFolderIds) {
      await helpers.updateFolderCounters(sourceFolderId);
    }
    await helpers.updateFolderCounters(folderId);

    res.json({ message: 'Mails moved' });
  } catch (error) {
    logger.error('Error bulk moving mails:', error);
    res.status(500).json({ error: 'Failed to move mails' });
  }
}

async function bulkDelete({ req, res, db, helpers, logger }) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  const { mailIds } = req.body;

  try {
    if (!Array.isArray(mailIds) || mailIds.length === 0) {
      return res.status(400).json({ error: 'Mail IDs required' });
    }

    const placeholders = mailIds.map((_, i) => `$${i + 1}`).join(',');
    const { rows: mailRows } = await db.query(
      `SELECT m.id, m.account_id, m.folder_id, m.imap_uid, f.imap_folder_path, f.folder_name, f.folder_type
       FROM mail m
       LEFT JOIN mail_folders f ON f.id = m.folder_id
       WHERE m.id IN (${placeholders}) AND m.user_id = $${mailIds.length + 1}`,
      [...mailIds, userId]
    );

    const { rows: accounts } = await db.query('SELECT * FROM mail_accounts WHERE user_id = $1', [userId]);
    const accountsMap = new Map(accounts.map((account) => [account.id, helpers.normalizeAccount(account)]));

    for (const mail of mailRows) {
      const mailImapUid = mail.imapUid || mail.imap_uid;
      const mailAccountId = mail.accountId || mail.account_id;
      if (mailImapUid && mailAccountId) {
        const mailAccount = accountsMap.get(mailAccountId);
        const sourceBoxPath = helpers.resolveImapBoxPath({
          imap_folder_path: mail.imapFolderPath || mail.imap_folder_path,
          folder_name: mail.folderName || mail.folder_name,
          folder_type: mail.folderType || mail.folder_type,
        }, mailAccount);

        const trashBoxPath = helpers.resolveImapBoxPath({
          imap_folder_path: 'Trash',
          folder_name: 'Trash',
          folder_type: 'trash',
        }, mailAccount);

        helpers.moveOnImap(userId, mailAccountId, mailImapUid, { imap_folder_path: trashBoxPath }, sourceBoxPath).catch((error) => {
          logger.error(`[MailBulkDelete] Error moving mail ${mail.id} to IMAP trash:`, error);
        });
      }

      // Удаляем физические файлы вложений
      if (mailAccountId && mail.id) {
        helpers.deleteMailAttachments(mailAccountId, mail.folderId || mail.folder_id, mail.id);
      }
    }

    const deletePlaceholders = mailIds.map((_, i) => `$${i + 1}`).join(',');
    const query = `DELETE FROM mail WHERE id IN (${deletePlaceholders}) AND user_id = $${mailIds.length + 1}`;
    await db.query(query, [...mailIds, userId]);

    const uniqueFolderIds = [...new Set(mailRows.map((mail) => mail.folderId || mail.folder_id).filter(Boolean))];
    for (const folderId of uniqueFolderIds) {
      await helpers.updateFolderCounters(folderId);
    }

    res.json({ message: 'Mails deleted' });
  } catch (error) {
    logger.error('Error bulk deleting mails:', error);
    res.status(500).json({ error: 'Failed to delete mails' });
  }
}

module.exports = {
  bulkRead,
  bulkMove,
  bulkDelete,
};