/**
 * Auth Service - handles authentication operations
 */
const db = require('../../../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const notificationService = require('../../../utils/notificationService');
const logger = require('../../../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'titan-crm-secret-key-2026';

/**
 * Authenticate user with email/identifier and password
 */
async function login(loginValue, password, clientIp, userAgent) {
  if (!loginValue || !password) {
    logger.warn('Missing credentials', { ip: clientIp, loginValue: loginValue || 'empty', userAgent });
    throw new Error('Требуется логин/email и пароль');
  }

  const { rows } = await db.query(
    'SELECT * FROM users WHERE email = $1 OR LOWER(name) = LOWER($1) OR LOWER(nickname) = LOWER($1)',
    [loginValue]
  );

  if (rows.length === 0) {
    logger.warn('User not found', { ip: clientIp, loginValue, userAgent });
    throw new Error('Пользователь не найден');
  }

  const user = rows[0];

  // Check password - PostgreSQL returns password_hash as passwordHash (camelCase)
  const passwordHash = user.password_hash || user.passwordHash;

  if (!passwordHash) {
    logger.error(`User has no password hash`, { userId: user.id, userName: user.name, ip: clientIp });
    throw new Error('Ошибка авторизации: пароль не установлен');
  }

  const passwordMatch = await bcrypt.compare(password, passwordHash);

  if (!passwordMatch) {
    logger.warn('Password mismatch', { userId: user.id, ip: clientIp, loginValue });
    throw new Error('Неверный пароль');
  }

  // Generate real JWT token
  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  logger.info('Login successful', { userId: user.id, ip: clientIp, loginValue });

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
      initials: user.initials,
      avatar: user.avatar
    },
    token
  };
}

/**
 * Request password reset
 */
async function requestPasswordReset(identifier, method = null) {
  // 1. Find user
  const { rows: users } = await db.query(
    'SELECT id, email, nickname, telegram_token FROM users WHERE email = $1 OR LOWER(nickname) = LOWER($1)',
    [identifier]
  );

  if (users.length === 0) {
    // Don't reveal if user exists (security best practice)
    return {
      success: true,
      message: 'Если аккаунт существует, мы отправили инструкции.',
      requireSelection: false
    };
  }

  const user = users[0];

  // 2. Get System Settings
  const { rows: settings } = await db.query(
    "SELECT * FROM system_settings WHERE setting_key IN ('email_config', 'telegram_config')"
  );

  let emailConfig = {};
  let telegramConfig = {};

  settings.forEach(row => {
    const key = row.settingKey || row.setting_key;
    let val = row.value;
    if (typeof val === 'string') {
      try {
        val = JSON.parse(val);
      } catch (e) {
        logger.warn('JSON Parse Error', e);
      }
    }
    if (key === 'email_config') emailConfig = val;
    if (key === 'telegram_config') telegramConfig = val;
  });

  // 3. Check Availability
  const isEmailSystemActive = emailConfig && !!emailConfig.host && !!emailConfig.user;
  const isTelegramSystemActive = telegramConfig && !!telegramConfig.botToken && telegramConfig.enabled === true;

  const canSendEmail = !!user.email && isEmailSystemActive;
  const canSendTelegram = !!user.telegram_token && isTelegramSystemActive;

  if (!canSendEmail && !canSendTelegram) {
    let errorMsg = 'Нет доступных способов восстановления.';
    if (!user.email && !user.telegram_token) {
      errorMsg += ' В профиле не указаны контакты.';
    } else {
      errorMsg += ' Интеграции отключены администратором.';
    }
    throw new Error(errorMsg);
  }

  // 4. Select Method
  let targetMethod = method;

  if (!targetMethod) {
    if (canSendEmail && canSendTelegram) {
      return {
        success: true,
        requireSelection: true,
        options: { email: user.email, telegram: 'Telegram' }
      };
    }
    targetMethod = canSendEmail ? 'email' : 'telegram';
  } else {
    if (targetMethod === 'email' && !canSendEmail) {
      throw new Error('Отправка на Email недоступна (не настроено или нет email)');
    }
    if (targetMethod === 'telegram' && !canSendTelegram) {
      throw new Error('Отправка в Telegram недоступна (бот отключен или не указан ID)');
    }
  }

  // 5. Generate Token
  const resetToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const expires = new Date(Date.now() + 3600000); // 1 hour

  await db.query(
    'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
    [resetToken, expires, user.id]
  );

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  // 6. Send
  try {
    if (targetMethod === 'email') {
      const html = `
                <h1>Сброс пароля TITAN CRM</h1>
                <p>Для сброса пароля перейдите по ссылке:</p>
                <a href="${resetLink}">${resetLink}</a>
            `;
      const sent = await notificationService.sendEmail(user.email, 'Сброс пароля', html);
      if (!sent) throw new Error('Сбой отправки Email');
      return { success: true, message: `Ссылка отправлена на ${user.email}` };
    } else if (targetMethod === 'telegram') {
      const text = `<b>🔑 Сброс пароля TITAN CRM</b>\n\nДля сброса пароля перейдите по ссылке:\n${resetLink}`;
      const sent = await notificationService.sendTelegram(user.telegram_token, text);
      if (!sent) throw new Error('Сбой отправки Telegram');
      return { success: true, message: `Ссылка отправлена в Telegram` };
    } else {
      throw new Error('Некорректный метод');
    }
  } catch (sendError) {
    logger.error('Notification Error', sendError);
    throw new Error('Ошибка при отправке сообщения. Проверьте логи сервера.');
  }
}

/**
 * Reset password with token
 */
async function resetPassword(token, newPassword) {
  if (!token || !newPassword) {
    throw new Error('Требуется токен и новый пароль');
  }

  if (newPassword.length < 6) {
    throw new Error('Пароль должен содержать минимум 6 символов');
  }

  const { rows } = await db.query(
    'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
    [token]
  );

  if (rows.length === 0) {
    throw new Error('Токен недействителен или истек');
  }

  const userId = rows[0].id;
  const newHash = await bcrypt.hash(newPassword, 10);

  await db.query(
    'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
    [newHash, userId]
  );

  logger.info('Password reset successful', { userId });

  return { success: true, message: 'Пароль успешно изменен' };
}

module.exports = {
  login,
  requestPasswordReset,
  resetPassword,
};
