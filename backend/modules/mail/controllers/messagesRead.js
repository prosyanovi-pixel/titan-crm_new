/**
 * Mail read helper
 */

const logger = require('../../../utils/logger');

async function getMailById({ req, res, db, helpers }) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  try {
    const { rows } = await db.query(
      `SELECT 
        id, subject, sender, senderemail as "senderEmail", content, html_content as "htmlContent",
        date, read as "isRead", is_starred as "isStarred", folder_id as "folderId",
        has_attachments as "hasAttachments", account_id as "accountId", message_id as "messageId",
        imap_uid as "imapUid", imap_flags as "imapFlags", created_at as "createdAt", updated_at as "updatedAt"
       FROM mail WHERE id = $1 AND user_id = $2`,
      [req.params.id, userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Mail not found' });

    const mail = rows[0];

    let { rows: attachments } = await db.query(
      'SELECT id, filename, content_type as "contentType", file_size as "fileSize", stored_path as "storedPath" FROM mail_attachments WHERE mail_id = $1',
      [req.params.id]
    );

    if (attachments.length === 0 && mail.messageId && mail.accountId) {
      const fallback = await db.query(
        `SELECT ma.id, ma.filename, ma.content_type as "contentType", ma.file_size as "fileSize", ma.stored_path as "storedPath"
         FROM mail_attachments ma INNER JOIN mail m ON m.id = ma.mail_id
         WHERE m.user_id = $1 AND m.account_id = $2 AND m.message_id = $3
         ORDER BY m.created_at DESC, ma.created_at DESC`,
        [userId, mail.accountId, mail.messageId]
      );
      attachments = fallback.rows;
    }

    mail.attachments = attachments;
    mail.hasAttachments = attachments.length > 0;

    await db.query('UPDATE mail SET has_attachments = $1 WHERE id = $2', [attachments.length > 0, req.params.id]);
    await db.query('UPDATE mail SET read = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [req.params.id]);

    if (mail.imapUid && mail.accountId && mail.folderId) {
      const { rows: folderRows } = await db.query('SELECT folder_name, folder_type, imap_folder_path FROM mail_folders WHERE id = $1', [mail.folderId]);
      const boxPath = helpers.resolveImapBoxPath(folderRows[0]);

      helpers.setFlagImap(userId, mail.accountId, mail.imapUid, '\\Seen', true, boxPath).catch((error) => {
        logger.error('Error syncing flag to IMAP on open:', error);
      });
    }

    res.json(mail);
  } catch (error) {
    logger.error('Error fetching mail:', error);
    res.status(500).json({ error: 'Failed to fetch mail' });
  }
}

module.exports = {
  getMailById,
};