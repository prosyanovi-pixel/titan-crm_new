/**
 * Mail list helper (getAllMails)
 */

const logger = require('../../../utils/logger');

async function getAllMails({ req, res, db, helpers }) {
  const userId = req.get('x-user-id');
  if (!userId) return res.status(401).json({ error: 'User ID required' });

  const {
    accountId, folderId, search, searchQuery,
    limit = 50, offset = 0, isRead, isStarred, includeSubfolders
  } = req.query;

  const includeChildren = includeSubfolders === 'true';

  try {
    const activeSearch = searchQuery || search;

    let query = `
      SELECT m.id, m.subject, m.sender, m.senderemail as "senderEmail",
             m.content, m.html_content as "htmlContent", m.date,
             m.read as "isRead", m.is_starred as "isStarred", m.folder_id as "folderId",
             m.has_attachments as "hasAttachments", m.created_at as "createdAt",
             m.imap_flags as "imapFlags", ma.email as "accountEmail",
             msq.status as "sendStatus"
      FROM mail m
      LEFT JOIN mail_accounts ma ON m.account_id = ma.id
      LEFT JOIN mail_send_queue msq ON m.id = msq.mail_id
      WHERE m.user_id = $1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM mail m WHERE m.user_id = $1';
    
    const params = [userId];
    let p = 2;

    if (accountId && accountId !== 'all') { 
      query += ` AND m.account_id = $${p}`; 
      countQuery += ` AND m.account_id = $${p}`; 
      params.push(accountId); 
      p++; 
    }

    if (folderId) {
      if (includeChildren) {
        const cte = `WITH RECURSIVE subfolders AS (
          SELECT id FROM mail_folders WHERE id = $${p} AND user_id = $1
          UNION ALL
          SELECT f.id FROM mail_folders f
          INNER JOIN subfolders s ON f.parent_folder_id = s.id
          WHERE f.user_id = $1
        )`;
        query = `${cte} ${query} AND m.folder_id IN (SELECT id FROM subfolders)`;
        countQuery = `${cte} ${countQuery} AND m.folder_id IN (SELECT id FROM subfolders)`;
        params.push(folderId); 
        p++;
      } else {
        query += ` AND m.folder_id = $${p}`; 
        countQuery += ` AND m.folder_id = $${p}`; 
        params.push(folderId); 
        p++;
      }
    } else if (req.query.folderType) {
      query += ` AND m.folder_id IN (SELECT id FROM mail_folders WHERE user_id = $1 AND folder_type = $${p})`;
      countQuery += ` AND m.folder_id IN (SELECT id FROM mail_folders WHERE user_id = $1 AND folder_type = $${p})`;
      params.push(req.query.folderType);
      p++;
    }

    if (isRead !== undefined) { 
      query += ` AND m.read = $${p}`; 
      countQuery += ` AND m.read = $${p}`; 
      params.push(isRead === 'true'); 
      p++; 
    }
    if (isStarred !== undefined) { 
      query += ` AND m.is_starred = $${p}`; 
      countQuery += ` AND m.is_starred = $${p}`; 
      params.push(isStarred === 'true'); 
      p++; 
    }

    if (activeSearch && activeSearch.trim().length > 0) {
      const trimmedSearch = activeSearch.trim();
      const ilikeSearch = `%${trimmedSearch}%`;
      query += ` AND (m.search_vector @@ plainto_tsquery('russian', $${p}) OR m.subject ILIKE $${p+1} OR m.sender ILIKE $${p+1} OR m.senderemail ILIKE $${p+1})`;
      countQuery += ` AND (m.search_vector @@ plainto_tsquery('russian', $${p}) OR m.subject ILIKE $${p+1} OR m.sender ILIKE $${p+1} OR m.senderemail ILIKE $${p+1})`;
      params.push(trimmedSearch, ilikeSearch); 
      p += 2;
    }

    query += ` ORDER BY m.date DESC LIMIT $${p++} OFFSET $${p}`;
    const listParams = [...params, parseInt(limit), parseInt(offset)];

    const { rows } = await db.query(query, listParams);
    const { rows: countResult } = await db.query(countQuery, params);

    const mails = await helpers.applyActualAttachmentFlags(userId, rows);

    const total = parseInt(countResult[0].total);
    const parsedOffset = parseInt(offset);

    res.json({
      mails, 
      total,
      limit: parseInt(limit), 
      offset: parsedOffset,
      hasMore: (parsedOffset + mails.length) < total
    });
  } catch (error) {
    logger.error('Error fetching mails:', error);
    res.status(500).json({ error: 'Failed to fetch mails' });
  }
}

module.exports = { getAllMails };
