const express = require('express');

const db = require('../../../../db');
const logger = require('../../../../utils/logger');

const router = express.Router();

router.get('/', async (req, res) => {
	try {
		const { rows } = await db.query('SELECT * FROM system_settings');
		const settings = {};

		rows.forEach(row => {
			const key = row.settingKey || row.setting_key;

			let val = row.value;
			if (typeof val === 'string') {
				try {
					val = JSON.parse(val);
				} catch (e) {
					// If parsing fails, we assume it's a plain string stored without quotes.
					// We can safely ignore the error and keep val as the raw string.
				}
			}

			if (key) {
				settings[key] = val;
			}
		});

		res.json(settings);
	} catch (err) {
		logger.error('Error fetching settings', err);
		res.status(500).json({ error: err.message });
	}
});

router.post('/', async (req, res) => {
	try {
		const { key, value } = req.body;
		const jsonValue = typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value);

		await db.query(
			`INSERT INTO system_settings (setting_key, value, updated_at)
			 VALUES ($1, $2, CURRENT_TIMESTAMP)
			 ON CONFLICT (setting_key)
			 DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
			[key, jsonValue]
		);

		if (key === 'sync_config') {
			const syncScheduler = require('../../../services/syncScheduler');
			await syncScheduler.init();
		}

		res.json({ success: true });
	} catch (err) {
		logger.error('Error saving setting', err);
		res.status(500).json({ error: err.message });
	}
});

router.post('/bulk', async (req, res) => {
	try {
		const { settings } = req.body;
		if (!Array.isArray(settings)) {
			return res.status(400).json({ error: 'Expected an array of settings' });
		}

		await db.query('BEGIN');
		
		for (const setting of settings) {
			const { key, value } = setting;
			const jsonValue = typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value);
			
			await db.query(
				`INSERT INTO system_settings (setting_key, value, updated_at)
				 VALUES ($1, $2, CURRENT_TIMESTAMP)
				 ON CONFLICT (setting_key)
				 DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
				[key, jsonValue]
			);
		}
		
		await db.query('COMMIT');
		res.json({ success: true });
	} catch (err) {
		await db.query('ROLLBACK');
		logger.error('Error saving bulk settings', err);
		res.status(500).json({ error: err.message });
	}
});

module.exports = router;