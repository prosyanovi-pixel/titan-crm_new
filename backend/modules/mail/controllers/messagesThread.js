/**
 * Mail thread helper
 */

const logger = require('../../../utils/logger');

async function getMailThread({ req, res, db }) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  try {
    const { id } = req.params;

    const { rows: originRows } = await db.query(
      'SELECT subject, senderemail, message_id, in_reply_to, references_header FROM mail WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (originRows.length === 0) return res.status(404).json({ error: 'Mail not found' });

    const original = originRows[0];
    const cleanSubject = (original.subject || '').replace(/^(Re|Fwd|Fw|Ответ|Переслано):\s*/i, '').trim();

    const { rows: threadRows } = await db.query(
      `SELECT m.id, m.subject, m.sender, m.senderemail as "senderEmail", 
              m.date, m.read as "isRead", m.folder_id as "folderId",
              m.has_attachments as "hasAttachments", m.created_at as "createdAt",
              m.imap_flags as "imapFlags",
              m.content, m.html_content as "htmlContent"
       FROM mail m
       WHERE m.user_id = $1 
         AND m.id != $2
         AND (
           (m.message_id IS NOT NULL AND m.message_id = $3)
           OR (m.in_reply_to IS NOT NULL AND m.in_reply_to = $4)
           OR (m.message_id IS NOT NULL AND $5 LIKE '%' || m.message_id || '%')
           OR (
             LENGTH($6) > 3 AND 
             (m.subject ILIKE $6 OR m.subject ILIKE $7) AND
             (m.senderemail = $8 OR $8 ILIKE '%' || m.senderemail || '%')
           )
         )
       ORDER BY m.date ASC`,
      [
        userId,
        id,
        original.in_reply_to,
        original.message_id,
        original.references_header,
        cleanSubject,
        `%${cleanSubject}%`,
        original.senderemail,
      ]
    );

    res.json(threadRows);
  } catch (error) {
    logger.error('Error fetching mail thread:', error);
    res.status(500).json({ error: 'Failed to fetch thread' });
  }
}

module.exports = {
  getMailThread,
};