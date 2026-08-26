/**
 * Mail Module - Attachments Controller
 * Загрузка, скачивание, удаление вложений
 */

const db = require('../../../db');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const helpers = require('../utils/helpers');
const logger = require('../../../utils/logger');

// ----- UPLOAD attachments -----

async function uploadAttachments(req, res) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { rows: mailRows } = await db.query(
      'SELECT m.id, m.account_id, m.folder_id, f.folder_name, m.subject, m.created_at as date, m.sender as sender FROM mail m LEFT JOIN mail_folders f ON m.folder_id = f.id WHERE m.id = $1 AND m.user_id = $2', [req.params.mailId, userId]
    );
    if (mailRows.length === 0) return res.status(404).json({ error: 'Mail not found' });

    const mail = mailRows[0];
    const accountId = mail.account_id;
    const folderId = mail.folder_id;
    const mailInfo = { folderName: mail.folder_name, subject: mail.subject, date: mail.date, sender: mail.sender };

    const attachments = [];
    for (const file of req.files) {
      const { storedPath, directory } = helpers.buildAttachmentPath(accountId, folderId, req.params.mailId, file.originalname, mailInfo);

      // Move uploaded file to structured directory
      const oldPath = file.path;
      const newPath = path.join(directory, path.basename(storedPath));
      if (oldPath && oldPath !== newPath) {
        fs.renameSync(oldPath, newPath);
      }

      const attachmentId = `attachment_${uuidv4()}`;
      const { rows } = await db.query(
        `INSERT INTO mail_attachments (id, mail_id, filename, content_type, file_size, stored_path)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, filename, content_type, file_size`,
        [attachmentId, req.params.mailId, file.originalname, file.mimetype, file.size, storedPath]
      );
      attachments.push(rows[0]);
    }

    await db.query('UPDATE mail SET has_attachments = TRUE WHERE id = $1', [req.params.mailId]);
    res.status(201).json(attachments);
  } catch (error) {
    logger.error('Error uploading attachments:', error);
    res.status(500).json({ error: 'Failed to upload attachments' });
  }
}

// ----- GET attachments -----

async function getAttachments(req, res) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  try {
    const { rows: mailRows } = await db.query(
      `SELECT id, account_id, message_id FROM mail WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [req.params.mailId, userId]
    );
    if (!mailRows.length) return res.status(404).json({ error: 'Mail not found' });

    const mail = mailRows[0];

    let { rows } = await db.query(
      `SELECT ma.* FROM mail_attachments ma INNER JOIN mail m ON ma.mail_id = m.id
       WHERE ma.mail_id = $1 AND m.user_id = $2`,
      [req.params.mailId, userId]
    );

    if (rows.length === 0 && mail.messageId && mail.accountId) {
      const fallback = await db.query(
        `SELECT ma.* FROM mail_attachments ma INNER JOIN mail m ON ma.mail_id = m.id
         WHERE m.user_id = $1 AND m.account_id = $2 AND m.message_id = $3
         ORDER BY m.created_at DESC, ma.created_at DESC`,
        [userId, mail.accountId, mail.messageId]
      );
      rows = fallback.rows;
    }

    await db.query(
      'UPDATE mail SET has_attachments = $1 WHERE id = $2 AND user_id = $3',
      [rows.length > 0, req.params.mailId, userId]
    );

    res.json(rows);
  } catch (error) {
    logger.error('Error fetching attachments:', error);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
}

// ----- DOWNLOAD attachment -----

async function downloadAttachment(req, res) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  try {
    const { rows } = await db.query(
      `SELECT ma.* FROM mail_attachments ma INNER JOIN mail m ON ma.mail_id = m.id
       WHERE ma.id = $1 AND m.user_id = $2`,
      [req.params.attachmentId, userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Attachment not found' });

    const attachment = rows[0];
    let storedPath = attachment.storedPath || attachment.stored_path;

    // Если у вложения пустой путь (оно было загружено в "Лёгком режиме" - light mode)
    // ИЛИ файл физически не существует на диске - загружаем по требованию из IMAP
    const fileExists = storedPath && fs.existsSync(helpers.resolveAttachmentPath(storedPath));
    
    if (!fileExists) {
      logger.info(`[AttachmentDownload] File missing for attachment ${req.params.attachmentId}: stored_path="${storedPath}", exists: ${fileExists}`);
      logger.info(`[AttachmentDownload] Triggering on-demand IMAP fetch...`);
      
      const mailSyncService = require('../services/mailSyncService');
      const fetchResult = await mailSyncService.fetchAttachmentFromImap(req.params.attachmentId, userId);
      
      if (!fetchResult.success) {
        logger.error(`[AttachmentDownload] Failed to fetch from IMAP: ${fetchResult.error}`);
        return res.status(404).json({ error: `File not found and failed to fetch from IMAP: ${fetchResult.error}` });
      }

      // Получаем обновленный путь из БД
      const { rows: reChecked } = await db.query(
        'SELECT stored_path FROM mail_attachments WHERE id = $1',
        [req.params.attachmentId]
      );
      
      const newStoredPath = reChecked.length > 0 ? (reChecked[0].storedPath || reChecked[0].stored_path) : null;
      if (newStoredPath) {
        storedPath = newStoredPath;
        logger.info(`[AttachmentDownload] Successfully fetched from IMAP, new path: ${storedPath}`);
      } else {
        logger.error(`[AttachmentDownload] Failed to update stored_path after IMAP fetch`);
        return res.status(404).json({ error: 'File not found after IMAP fetch' });
      }
    }

    const filePath = helpers.resolveAttachmentPath(storedPath);
    if (!fs.existsSync(filePath)) {
      logger.error(`[AttachmentDownload] File does not exist at ${filePath}`);
      return res.status(404).json({ error: 'File not found' });
    }

    const rawName = String(helpers.decodeFilename(attachment.filename || 'attachment') || 'attachment');
    const safeName = rawName.replace(/[\r\n]/g, ' ').replace(/[\x00-\x1F\x7F]/g, '').trim() || 'attachment';
    const asciiName = safeName.replace(/[^ -~]+/g, '_').replace(/"/g, '').trim() || 'attachment';
    let encodedName = 'attachment';
    try { encodedName = encodeURIComponent(safeName); } catch { encodedName = encodeURIComponent('attachment'); }

    res.setHeader('Content-Disposition', `attachment; filename="${asciiName}"; filename*=UTF-8''${encodedName}`);
    res.sendFile(filePath, (err) => {
      if (err) {
        logger.error(`[AttachmentDownload] Error sending file: ${err.message}`);
        res.status(500).json({ error: 'Failed to download attachment' });
      }
    });
  } catch (error) {
    logger.error('Error downloading attachment:', error);
    res.status(500).json({ error: 'Failed to download attachment' });
  }
}

// ----- DELETE attachment -----

async function deleteAttachment(req, res) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  try {
    const { rows } = await db.query(
      `SELECT ma.* FROM mail_attachments ma INNER JOIN mail m ON ma.mail_id = m.id
       WHERE ma.id = $1 AND m.user_id = $2`,
      [req.params.attachmentId, userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Attachment not found' });

    const attachment = rows[0];
    const storedPath = attachment.storedPath || attachment.stored_path;
    const filePath = storedPath ? helpers.resolveAttachmentPath(storedPath) : null;

    await db.query('DELETE FROM mail_attachments WHERE id = $1', [req.params.attachmentId]);
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: 'Attachment deleted' });
  } catch (error) {
    logger.error('Error deleting attachment:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
}

module.exports = {
  uploadAttachments,
  getAttachments,
  downloadAttachment,
  deleteAttachment,
  upload: helpers.upload,
  uploadsDir: helpers.uploadsDir,
};
