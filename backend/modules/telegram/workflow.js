const axios = require('axios');

module.exports = {
  actions: {
    send_message: {
      label: 'Отправить сообщение в Telegram',
      inputSchema: {
        properties: {
          chat_id: { type: 'string', label: 'ID чата (Chat ID)' },
          message: { type: 'string', label: 'Текст сообщения', ui: { widget: 'textarea' } },
          parse_mode: { 
            type: 'string', 
            label: 'Режим разметки',
            enum: ['HTML', 'MarkdownV2', 'None'],
            default: 'HTML'
          }
        },
        required: ['chat_id', 'message']
      },
      outputSchema: {
        properties: {
          success: { type: 'boolean' },
          message_id: { type: 'number' }
        }
      },
      handler: async (config, context, logger) => {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
          throw new Error('TELEGRAM_BOT_TOKEN is not configured in .env');
        }

        const { chat_id, message, parse_mode } = config;
        
        logger.info(`Sending Telegram message to ${chat_id}...`);

        const payload = {
          chat_id,
          text: message,
        };

        if (parse_mode && parse_mode !== 'None') {
          payload.parse_mode = parse_mode;
        }

        try {
          const response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, payload);
          logger.info(`Telegram message sent successfully. ID: ${response.data.result.message_id}`);
          return {
            success: true,
            message_id: response.data.result.message_id,
            response: response.data.result
          };
        } catch (error) {
          const errorMsg = error.response?.data?.description || error.message;
          logger.error(`Telegram API Error: ${errorMsg}`);
          throw new Error(`Telegram API Error: ${errorMsg}`);
        }
      }
    }
  }
};
