const express = require('express');

const nodemailer = require('nodemailer');
const logger = require('../../../../../utils/logger');

const router = express.Router();

router.post('/test/email', async (req, res) => {
	const config = req.body;

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

		await transporter.verify();
		res.json({ success: true, message: 'Соединение с SMTP сервером успешно установлено' });
	} catch (error) {
		logger.error('SMTP Test Error', error);
		res.status(400).json({ success: false, error: error.message || 'Ошибка подключения к SMTP' });
	}
});

module.exports = router;