/**
 * Mail send helper
 */

const logger = require('../../../utils/logger');

async function sendMail({ req, res, db, helpers, uuidv4, mailSendService }) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  const { accountId, to, subject, htmlContent, content, cc, bcc, attachmentIds, saveToSent = true } = req.body;

  try {
    if (!accountId) return res.status(400).json({ error: 'Missing required field: accountId' });
    if (saveToSent && (!to || !subject)) {
      return res.status(400).json({ error: 'Missing required fields: to, subject' });
    }

    const { rows: accountRows } = await db.query(
      'SELECT * FROM mail_accounts WHERE id = $1 AND user_id = $2',
      [accountId, userId]
    );
    if (accountRows.length === 0) return res.status(404).json({ error: 'Account not found' });

    const normalizedAttachmentIds = Array.isArray(attachmentIds) ? attachmentIds : [];
    const mailId = `mail_${uuidv4()}`;
    const folderId = saveToSent ? await helpers.getSentFolderId(accountId) : await helpers.getDraftsFolderId(accountId);
    const normalizedSubject = subject || 'Без темы';

    await db.query(
      `INSERT INTO mail (id, user_id, account_id, folder_id, subject, sender, senderemail, content, html_content, date, read)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, TRUE)`,
      [
        mailId,
        userId,
        accountId,
        folderId,
        normalizedSubject,
        accountRows[0].display_name || accountRows[0].email,
        accountRows[0].email,
        content || '',
        htmlContent || '',
      ]
    );

    if (normalizedAttachmentIds.length > 0) {
      await db.query(
        `UPDATE mail_attachments SET mail_id = $1
         WHERE id = ANY($2) AND mail_id IN (SELECT id FROM mail WHERE user_id = $3)`,
        [mailId, normalizedAttachmentIds, userId]
      );
      await db.query('UPDATE mail SET has_attachments = TRUE WHERE id = $1', [mailId]);
    }

    if (!saveToSent) {
      return res.status(201).json({ success: true, message: 'Черновик создан', mailId });
    }

    const queueResult = await mailSendService.queueMail({
      accountId,
      userId,
      mailId,
      to: Array.isArray(to) ? to : [to],
      cc: cc || null,
      bcc: bcc || null,
      subject: normalizedSubject,
      htmlContent,
      textContent: content,
      attachmentIds: normalizedAttachmentIds.length > 0 ? normalizedAttachmentIds : null,
    });

    res.status(201).json({
      success: true,
      message: 'Письмо поставлено в очередь на отправку',
      queueId: queueResult.queueId,
      mailId,
    });
  } catch (error) {
    logger.error('Error sending mail:', error);
    res.status(500).json({ error: 'Failed to send mail', details: error.message });
  }
}

module.exports = {
  sendMail,
};