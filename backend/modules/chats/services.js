const db = require('../../db');

/**
 * Получить список чатов с пагинацией и поиском
 */
async function getChats(query) {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = query.search || '';
  const platform = query.platform || '';

  let sql = `
    SELECT c.*, 
      (SELECT text FROM chat_messages m WHERE m.chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
      (SELECT created_at FROM chat_messages m WHERE m.chat_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
      false as is_online,
      null as last_active_at,
      u.avatar as user_avatar_fallback
    FROM chats c
    LEFT JOIN users u ON c.platform = 'internal' AND u.name = c.name
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    sql += ` AND c.name ILIKE $${params.length}`;
  }
  
  if (platform) {
    params.push(platform);
    sql += ` AND c.platform = $${params.length}`;
  }

  // Count total
  const countSql = `SELECT count(*) FROM (${sql}) AS filtered`;
  const { rows: countRows } = await db.query(countSql, params);
  const total = parseInt(countRows[0].count);

  sql += ` ORDER BY last_message_time DESC NULLS LAST, c.updated_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const { rows } = await db.query(sql, params);

  // Для internal чатов подставляем аватар пользователя если у чата нет своего
  const data = rows.map(row => ({
    ...row,
    avatarUrl: row.avatar_url || row.user_avatar_fallback || null,
  }));

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Получить сообщения чата
 */
async function getChatMessages(chatId, query) {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 50;
  const offset = (page - 1) * limit;

  const { rows } = await db.query(
    `SELECT cm.*, 
            u.first_name as sender_first_name, 
            u.last_name as sender_last_name, 
            u.avatar as sender_avatar_url 
     FROM chat_messages cm
     LEFT JOIN users u ON cm.sender_type = 'user' AND cm.sender_id::text = u.id
     WHERE cm.chat_id = $1 
     ORDER BY cm.created_at ASC 
     LIMIT $2 OFFSET $3`,
    [chatId, limit, offset]
  );

  return rows;
}

/**
 * Пометить сообщения как прочитанные
 */
async function markAsRead(chatId) {
  await db.query(
    `UPDATE chat_messages SET is_read = TRUE WHERE chat_id = $1 AND is_read = FALSE`,
    [chatId]
  );
  await db.query(
    `UPDATE chats SET unread_count = 0 WHERE id = $1`,
    [chatId]
  );
}

/**
 * Отправить сообщение в чат
 */
async function sendMessage(chatId, text, senderId, attachments = []) {
  // Fetch chat details to know platform and external_chat_id
  const { rows: chats } = await db.query(`SELECT platform, external_chat_id FROM chats WHERE id = $1`, [chatId]);
  if (chats.length === 0) throw new Error('Chat not found');
  const chat = chats[0];

  let externalMessageId = null;

  if (chat.platform === 'telegram') {
    const { rows: settings } = await db.query(`SELECT value FROM system_settings WHERE setting_key = 'telegram_config'`);
    if (settings.length > 0) {
      const config = settings[0].value;
      if (config.enabled && config.botToken) {
        const axios = require('axios');
        try {
          const res = await axios.post(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
            chat_id: chat.external_chat_id,
            text: text,
          });
          externalMessageId = res.data.result.message_id.toString();
        } catch (error) {
          const logger = require('../../utils/logger');
          logger.error('Error sending telegram message:', error.response?.data || error.message);
          // throw new Error('Failed to send Telegram message'); // Or we just save it as internal? Let's throw for now to show failure in UI
        }
      }
    }
  }

  const { rows } = await db.query(
    `INSERT INTO chat_messages (chat_id, sender_type, sender_id, text, is_read, external_message_id, attachments)
     VALUES ($1, 'user', $2, $3, TRUE, $4, $5::jsonb)
     RETURNING *`,
    [chatId, senderId, text, externalMessageId, JSON.stringify(attachments)]
  );
  
  await db.query(
    `UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [chatId]
  );

  return rows[0];
}

/**
 * Создать новый чат
 */
async function createChat(name, platform = 'internal') {
  // For internal chats, try to find user's avatar
  let avatarUrl = null;
  if (platform === 'internal') {
    const { rows: userRows } = await db.query('SELECT avatar FROM users WHERE name = $1 LIMIT 1', [name]);
    if (userRows.length > 0) avatarUrl = userRows[0].avatar;
  }
  const { rows } = await db.query(
    `INSERT INTO chats (name, platform, avatar_url, unread_count) VALUES ($1, $2, $3, 0) RETURNING *`,
    [name, platform, avatarUrl]
  );
  return rows[0];
}

/**
 * Редактировать сообщение
 */
async function editMessage(chatId, messageId, text, userId) {
  // Verify ownership
  const { rows: msgRows } = await db.query(`SELECT sender_id, sender_type FROM chat_messages WHERE id = $1 AND chat_id = $2`, [messageId, chatId]);
  if (msgRows.length === 0) throw new Error('Message not found');
  if (msgRows[0].sender_type !== 'user' || msgRows[0].sender_id !== userId) {
    throw new Error('You can only edit your own messages');
  }

  const { rows } = await db.query(
    `UPDATE chat_messages SET text = $1, is_edited = TRUE WHERE id = $2 RETURNING *`,
    [text, messageId]
  );
  return rows[0];
}

/**
 * Очистить историю сообщений
 */
async function clearChatHistory(chatId) {
  await db.query(`DELETE FROM chat_messages WHERE chat_id = $1`, [chatId]);
}

/**
 * Удалить чат полностью
 */
async function deleteChat(chatId) {
  await db.query(`DELETE FROM chats WHERE id = $1`, [chatId]);
}

/**
 * Очистить старые сообщения в соответствии с политикой хранения
 */
async function cleanupOldMessages() {
  try {
    const { rows } = await db.query(`SELECT value FROM system_settings WHERE setting_key = 'chat_retention_policy'`);
    if (rows.length > 0 && rows[0].value?.enabled && rows[0].value?.days > 0) {
      const days = rows[0].value.days;
      await db.query(
        `DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '${days} days'`
      );
      const logger = require('../../utils/logger');
      logger.info(`[Chats] Cleaned up chat messages older than ${days} days`);
    }
  } catch (error) {
    const logger = require('../../utils/logger');
    logger.error('[Chats] Error cleaning up old messages:', error);
  }
}

// Запускаем очистку раз в сутки
setInterval(cleanupOldMessages, 24 * 60 * 60 * 1000);
// Выполняем один раз при старте через минуту
setTimeout(cleanupOldMessages, 60 * 1000);

module.exports = {
  getChats,
  getChatMessages,
  markAsRead,
  sendMessage,
  createChat,
  editMessage,
  clearChatHistory,
  deleteChat,
  cleanupOldMessages
};
