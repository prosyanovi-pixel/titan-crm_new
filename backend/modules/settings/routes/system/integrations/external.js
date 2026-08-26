const express = require('express');

const db = require('../../../../../db');
const axios = require('axios');
const logger = require('../../../../../utils/logger');
const moduleSettingsLoader = require('../../../../../utils/moduleSettingsLoader');

const router = express.Router();

router.get('/apifns/stat', async (req, res) => {
	try {
		const modSettings = await moduleSettingsLoader.getModuleSettings('enrichment');
		const key = modSettings.apiKeys?.apifnsKey;

		if (!key || typeof key !== 'string') return res.status(404).json({ error: 'Ключ api-fns.ru не настроен в модуле обогащения' });

		const response = await axios.get('https://api-fns.ru/api/stat', {
			params: { key: key.trim() },
			timeout: 10000,
		});

		res.json(response.data);
	} catch (err) {
		logger.error('apifns stat error', err);

		if (err.response?.status === 403) {
			const ipMessage = err.response?.data?.toString() || '';
			const ipMatch = ipMessage.match(/\((\d+\.\d+\.\d+\.\d+)\)/);
			const blockedIp = ipMatch ? ipMatch[1] : 'неизвестен';

			return res.status(403).json({
				error: 'Доступ запрещён',
				message: `IP-адрес ${blockedIp} заблокирован в настройках api-fns.ru`,
				hint: 'Добавьте этот IP в личном кабинете api-fns.ru в разделе настроек API доступа',
			});
		}

		res.status(502).json({ error: err.message });
	}
});

router.get('/dadata/stat', async (req, res) => {
	try {
		const modSettings = await moduleSettingsLoader.getModuleSettings('enrichment');
		const key = modSettings.apiKeys?.dadataKey;

		if (!key) return res.status(404).json({ error: 'Ключ DaData не настроен в модуле обогащения' });

		const { rows: todayStats } = await db.query(
			`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE success = TRUE) AS successful
			 FROM enrichment_stats
			 WHERE service = 'dadata' AND DATE(requested_at) = CURRENT_DATE`
		);

		const { rows: dailyStats } = await db.query(
			`SELECT DATE(requested_at) AS date, 
					COUNT(*) AS total,
					COUNT(*) FILTER (WHERE success = TRUE) AS successful
			 FROM enrichment_stats
			 WHERE service = 'dadata' AND requested_at >= CURRENT_DATE - INTERVAL '6 days'
			 GROUP BY DATE(requested_at)
			 ORDER BY date DESC`
		);

		res.json({
			today: {
				total: parseInt(todayStats[0]?.total || 0),
				successful: parseInt(todayStats[0]?.successful || 0),
				remaining: Math.max(0, 10000 - (todayStats[0]?.total || 0)),
				limit: 10000,
			},
			daily: dailyStats.map(row => ({
				date: row.date,
				total: parseInt(row.total),
				successful: parseInt(row.successful),
			})),
		});
	} catch (err) {
		logger.error('dadata stat error', err);
		res.status(502).json({ error: err.message });
	}
});

router.post('/test/telegram', async (req, res) => {
	const { botToken, chatId } = req.body;

	if (!botToken) return res.status(400).json({ error: 'Токен не указан' });

	try {
		const meResponse = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`);
		if (!meResponse.data.ok) {
			throw new Error('Invalid Token');
		}

		const botName = meResponse.data.result.first_name;

		if (chatId) {
			try {
				await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
					chat_id: chatId,
					text: '🤖 <b>Тестовое сообщение от TITAN CRM</b>\n\nЕсли вы это читаете, значит интеграция работает успешно!',
					parse_mode: 'HTML',
				});
				return res.json({
					success: true,
					message: `Бот ${botName} работает! Тестовое сообщение отправлено на ID ${chatId}`,
				});
			} catch (sendError) {
				logger.error('Telegram Send Error', { error: sendError.response?.data });
				if (sendError.response?.data?.description?.includes('chat not found') ||
					sendError.response?.data?.description?.includes('bot was blocked')) {
					return res.status(400).json({
						success: false,
						error: `Бот найден, но не может написать вам. Вы нажали "Start" в боте? Ошибка: ${sendError.response?.data?.description}`,
					});
				}
				throw sendError;
			}
		}

		res.json({
			success: true,
			message: `Токен верный! Бот: ${botName} (@${meResponse.data.result.username})`,
		});

	} catch (error) {
		logger.error('Telegram Test Error', { error: error.response?.data || error.message });
		res.status(400).json({ success: false, error: 'Ошибка соединения с Telegram или неверный токен' });
	}
});

module.exports = router;