
const db = require('../db');
const nodemailer = require('nodemailer');
const axios = require('axios');

async function getSetting(key) {
    try {
        const { rows } = await db.query('SELECT value FROM system_settings WHERE setting_key = $1', [key]);
        if (rows.length > 0) {
            let val = rows[0].value;
            // Handle stringified JSON if DB driver doesn't auto-parse JSONB or if stored as string
            if (typeof val === 'string') {
                try { val = JSON.parse(val); } catch(e) {}
            }
            return val;
        }
        return null;
    } catch (e) {
        console.error(`Error fetching setting ${key}:`, e);
        return null;
    }
}

const notificationService = {
    async sendEmail(to, subject, html) {
        const config = await getSetting('email_config');
        
        if (!config || !config.host || !config.user) {
            console.warn('[NotificationService] Email settings not configured properly.');
            return false;
        }

        try {
            const transporter = nodemailer.createTransport({
                host: config.host,
                port: parseInt(config.port),
                secure: config.secure,
                auth: {
                    user: config.user,
                    pass: config.password,
                },
            });

            await transporter.sendMail({
                from: config.from || config.user,
                to,
                subject,
                html,
            });
            console.log(`[NotificationService] Email sent to ${to}`);
            return true;
        } catch (error) {
            console.error('[NotificationService] Email send error:', error.message);
            return false;
        }
    },

    async sendTelegram(chatId, text) {
        const config = await getSetting('telegram_config');

        if (!config || !config.botToken || !config.enabled) {
            console.warn('[NotificationService] Telegram settings not configured or disabled.');
            return false;
        }

        try {
            await axios.post(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML'
            });
            console.log(`[NotificationService] Telegram sent to ${chatId}`);
            return true;
        } catch (error) {
            console.error('[NotificationService] Telegram send error:', error.response?.data?.description || error.message);
            // Don't throw, return false so caller handles it gracefully
            return false;
        }
    }
};

module.exports = notificationService;
