/**
 * Single mail mutation helper
 */

const logger = require('../../../utils/logger');

async function markRead({ req, res, db, helpers }) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  const { isRead } = req.body;

  try {
    const { rows: mailRows } = await db.query(
      'SELECT id, account_id, folder_id, imap_uid FROM mail WHERE id = $1 AND user_id = $2',
      [req.params.id, userId]
    );
    if (mailRows.length === 0) return res.status(404).json({ error: 'Mail not found' });

    const mail = mailRows[0];

    if (mail.imap_uid && mail.account_id && mail.folder_id) {
      const { rows: folderRows } = await db.query('SELECT folder_name, folder_type, imap_folder_path FROM mail_folders WHERE id = $1', [mail.folder_id]);
      const boxPath = helpers.resolveImapBoxPath(folderRows[0]);
      helpers.setFlagImap(userId, mail.account_id, mail.imap_uid, '\\Seen', isRead, boxPath).catch((error) => {
        logger.error('Error syncing flag to IMAP:', error);
      });
    }

    const { rows } = await db.query(
      'UPDATE mail SET read = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
      [isRead, req.params.id, userId]
    );

    if (mail.folder_id) {
      await helpers.updateFolderCounters(mail.folder_id);
    }

    res.json(rows[0]);
  } catch (error) {
    logger.error('Error updating mail read status:', error);
    res.status(500).json({ error: 'Failed to update mail' });
  }
}

async function toggleStar({ req, res, db, helpers }) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  const { isStarred } = req.body;

  try {
    const { rows: mailRows } = await db.query(
      'SELECT id, account_id, folder_id, imap_uid FROM mail WHERE id = $1 AND user_id = $2',
      [req.params.id, userId]
    );
    if (mailRows.length === 0) return res.status(404).json({ error: 'Mail not found' });

    const mail = mailRows[0];
    const mailImapUid = mail.imapUid || mail.imap_uid;
    const mailAccountId = mail.accountId || mail.account_id;
    const mailFolderId = mail.folderId || mail.folder_id;

    if (mailImapUid && mailAccountId && mailFolderId) {
      const { rows: folderRows } = await db.query('SELECT folder_name, folder_type, imap_folder_path FROM mail_folders WHERE id = $1', [mailFolderId]);
      const boxPath = helpers.resolveImapBoxPath({
        ...folderRows[0],
        imap_folder_path: folderRows[0].imapFolderPath || folderRows[0].imap_folder_path,
        folder_name: folderRows[0].folderName || folderRows[0].folder_name,
        folder_type: folderRows[0].folderType || folderRows[0].folder_type
      });
      helpers.setFlagImap(userId, mailAccountId, mailImapUid, '\\Flagged', isStarred, boxPath).catch((error) => {
        logger.error('Error syncing star flag to IMAP:', error);
      });
    }

    const { rows } = await db.query(
      'UPDATE mail SET is_starred = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
      [isStarred, req.params.id, userId]
    );
    res.json(rows[0]);
  } catch (error) {
    logger.error('Error updating mail starred status:', error);
    res.status(500).json({ error: 'Failed to update mail' });
  }
}

async function moveMail({ req, res, db, helpers, logger }) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  const { folderId } = req.body;

  try {
    if (!folderId) return res.status(400).json({ error: 'Folder ID required' });

    const { rows: mailRows } = await db.query(
      'SELECT id, account_id, imap_uid FROM mail WHERE id = $1 AND user_id = $2',
      [req.params.id, userId]
    );
    if (mailRows.length === 0) return res.status(404).json({ error: 'Mail not found' });

    const mail = mailRows[0];

    const { rows: targetFolderInfo } = await db.query(
      'SELECT id, folder_name, imap_folder_path, account_id, folder_type FROM mail_folders WHERE id = $1 AND user_id = $2',
      [folderId, userId]
    );
    if (targetFolderInfo.length === 0) return res.status(404).json({ error: 'Target folder not found' });

    const targetFolder = targetFolderInfo[0];

    logger.info(`[MailMove] Attempting move: mail=${mail.id}, to_folder=${folderId} (${targetFolder.folderName || targetFolder.folder_name})`);

    const mailAccountId = mail.accountId || mail.account_id;
    const mailImapUid = mail.imapUid || mail.imap_uid;

    const { rows: accountRows } = await db.query('SELECT * FROM mail_accounts WHERE id = $1', [mailAccountId]);
    const account = accountRows[0] ? helpers.normalizeAccount(accountRows[0]) : null;

    if (mailImapUid && mailAccountId) {
      const targetBoxPath = helpers.resolveImapBoxPath({
        ...targetFolder,
        imap_folder_path: targetFolder.imapFolderPath || targetFolder.imap_folder_path,
        folder_name: targetFolder.folderName || targetFolder.folder_name,
        folder_type: targetFolder.folderType || targetFolder.folder_type
      }, account);
      
      if (targetBoxPath) {
        const { rows: sourceFolderRows } = await db.query(
          `SELECT mf.imap_folder_path, mf.folder_name, mf.folder_type
           FROM mail m
           JOIN mail_folders mf ON mf.id = m.folder_id
           WHERE m.id = $1`,
          [req.params.id]
        );
        let sourceBoxPath = 'INBOX';
        if (sourceFolderRows.length > 0) {
           const srcFolder = sourceFolderRows[0];
           sourceBoxPath = helpers.resolveImapBoxPath({
             imap_folder_path: srcFolder.imapFolderPath || srcFolder.imap_folder_path,
             folder_name: srcFolder.folderName || srcFolder.folder_name,
             folder_type: srcFolder.folderType || srcFolder.folder_type
           }, account) || 'INBOX';
        }

        logger.info(`[MailMove] IMAP sync: UID ${mailImapUid} from "${sourceBoxPath}" to "${targetBoxPath}"`);

        try {
          await helpers.moveOnImap(userId, mailAccountId, mailImapUid, { 
            ...targetFolder, 
            imap_folder_path: targetBoxPath,
            folder_name: targetFolder.folderName || targetFolder.folder_name,
            folder_type: targetFolder.folderType || targetFolder.folder_type
          }, sourceBoxPath);
          logger.info('[MailMove] IMAP move successful');
        } catch (imapError) {
          logger.error(`[MailMove] IMAP move FAILED: ${imapError.message}`, { stack: imapError.stack });
        }
      } else {
        logger.warn(`[MailMove] Could not resolve target box path for folder ${folderId}`);
      }
    }

    const { rows: currentMailRows } = await db.query('SELECT folder_id FROM mail WHERE id = $1', [req.params.id]);
    const sourceFolderId = currentMailRows[0]?.folder_id;

    const { rows } = await db.query(
      'UPDATE mail SET folder_id = $1, imap_uid = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
      [folderId, req.params.id, userId]
    );

    if (sourceFolderId) await helpers.updateFolderCounters(sourceFolderId);
    if (folderId) await helpers.updateFolderCounters(folderId);

    logger.info(`[MailMove] Local DB update successful for mail ${mail.id}`);
    res.json(rows[0]);
  } catch (error) {
    logger.error('[MailMove] Fatal error moving mail:', error);
    res.status(500).json({ error: 'Failed to move mail: ' + error.message });
  }
}

async function deleteMail({ req, res, db, helpers, logger }) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  try {
    const { rows: mailRows } = await db.query(
      `SELECT m.id, m.account_id, m.folder_id, m.imap_uid, f.imap_folder_path, f.folder_name as source_folder_name
       FROM mail m
       LEFT JOIN mail_folders f ON f.id = m.folder_id
       WHERE m.id = $1 AND m.user_id = $2`,
      [req.params.id, userId]
    );
    if (mailRows.length === 0) return res.status(404).json({ error: 'Mail not found' });

    const mail = mailRows[0];
    logger?.info && logger.info(`[MailDelete] Deleting mail ${mail.id}`);
    

    if (mail.imap_uid && mail.account_id) {
      const sourceBoxPath = helpers.resolveImapBoxPath({
        imap_folder_path: mail.imap_folder_path,
        folder_name: mail.source_folder_name,
      });
      logger?.debug && logger.debug(`[MailDelete] IMAP delete: UID ${mail.imap_uid} from ${sourceBoxPath}`);
      await helpers.deleteFromImap(userId, mail.account_id, mail.imap_uid, sourceBoxPath);
    } else {
      logger?.debug && logger.debug(`[MailDelete] Local DB delete only (no IMAP UID or account) — imap_uid=${mail.imap_uid}, account_id=${mail.account_id}`);
    }

    // Удаляем физические файлы вложений
    if (mail.account_id && mail.id) {
       helpers.deleteMailAttachments(mail.account_id, mail.folder_id, mail.id);
    }

    await db.query('DELETE FROM mail WHERE id = $1 AND user_id = $2', [req.params.id, userId]);

    if (mail.folder_id) {
      await helpers.updateFolderCounters(mail.folder_id);
    }

    res.json({ message: 'Mail deleted' });
  } catch (error) {
    logger.error('[MailDelete] Error deleting mail:', error);
    res.status(500).json({ error: 'Failed to delete mail' });
  }
}

module.exports = {
  markRead,
  toggleStar,
  moveMail,
  deleteMail,
};