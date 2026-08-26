const db = require('../../db');
const websocketServer = require('../notifications/services/websocketServer');
const logger = require('../../utils/logger');

async function handleTelegramWebhook(req, res, next) {
  try {
    const { message } = req.body;

    if (!message || !message.chat || !message.text) {
      return res.status(200).send('OK');
    }

    const externalChatId = message.chat.id.toString();
    const text = message.text;
    const name = message.chat.first_name 
      ? `${message.chat.first_name} ${message.chat.last_name || ''}`.trim() 
      : message.chat.title || 'Telegram User';
    
    // Find if chat exists
    let { rows: chats } = await db.query(
      `SELECT * FROM chats WHERE platform = 'telegram' AND external_chat_id = $1`,
      [externalChatId]
    );

    let chatId;
    if (chats.length === 0) {
      // Try to match contractor by username or phone if provided (in this basic example we just create the chat)
      const { rows } = await db.query(
        `INSERT INTO chats (platform, external_chat_id, name, unread_count)
         VALUES ('telegram', $1, $2, 1)
         RETURNING id`,
        [externalChatId, name]
      );
      chatId = rows[0].id;
    } else {
      chatId = chats[0].id;
      await db.query(
        `UPDATE chats SET unread_count = unread_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [chatId]
      );
    }

    // Insert message
    const { rows: messages } = await db.query(
      `INSERT INTO chat_messages (chat_id, external_message_id, sender_type, text, is_read)
       VALUES ($1, $2, 'contractor', $3, FALSE)
       RETURNING *`,
      [chatId, message.message_id?.toString(), text]
    );

    // Notify clients via WebSocket
    websocketServer.broadcastToAll({
      type: 'new_chat_message',
      data: {
        chatId,
        message: messages[0]
      }
    });

    res.status(200).send('OK');
  } catch (error) {
    logger.error('Telegram Webhook error:', error);
    res.status(500).send('Error');
  }
}

module.exports = {
  handleTelegramWebhook
};
