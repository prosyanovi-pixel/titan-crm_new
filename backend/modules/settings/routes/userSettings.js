const express = require('express');
const router = express.Router();
const db = require('../../../db');
const logger = require('../../../utils/logger');

router.get('/', async (req, res) => {
	try {
		const userId = req.headers['x-user-id'];
		if (!userId) return res.status(401).json({ error: 'Unauthorized' });

		const { rows } = await db.query(
			'SELECT setting_key, value FROM user_settings WHERE user_id = $1',
			[userId]
		);

		const settings = {};
		rows.forEach(row => {
			const key = row.settingKey || row.setting_key;
			settings[key] = row.value;
		});

		res.json(settings);
	} catch (err) {
		logger.error('Error fetching all user settings', err);
		res.status(500).json({ error: 'Failed to fetch user settings' });
	}
});

router.get('/:key', async (req, res) => {
	try {
		const { key } = req.params;
		const userId = req.headers['x-user-id'];
		if (!userId) return res.status(401).json({ error: 'Unauthorized' });

		const { rows } = await db.query(
			'SELECT value FROM user_settings WHERE user_id = $1 AND setting_key = $2',
			[userId, key]
		);

		if (rows.length > 0) {
			res.json(rows[0].value);
		} else {
			res.json(null);
		}
	} catch (err) {
		logger.error('Error fetching user settings', err);
		res.status(500).json({ error: 'Failed to fetch user settings' });
	}
});

router.post('/', async (req, res) => {
	try {
		const { key, value } = req.body;
		const userId = req.headers['x-user-id'];
		if (!userId) return res.status(401).json({ error: 'Unauthorized' });

		const jsonValue = JSON.stringify(value);

		await db.query(
			`INSERT INTO user_settings (user_id, setting_key, value, updated_at)
			 VALUES ($1, $2, $3::text::jsonb, CURRENT_TIMESTAMP)
			 ON CONFLICT (user_id, setting_key)
			 DO UPDATE SET value = $3::text::jsonb, updated_at = CURRENT_TIMESTAMP`,
			[userId, key, jsonValue]
		);

		res.json({ success: true });
	} catch (err) {
		logger.error('Error saving user settings', err);
		res.status(500).json({ error: 'Failed to save user settings' });
	}
});

module.exports = router;