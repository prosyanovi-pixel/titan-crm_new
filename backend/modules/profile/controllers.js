/**
 * Контроллеры модуля Profile
 * Обработчики HTTP-запросов для управления профилем
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { asyncHandler } = require('../../utils/errorHandler');
const { sendSuccess, sendNotFound, sendValidationError, sendServerError } = require('../../utils/responseHelpers');
const db = require('../../db');
const logger = require('../../utils/logger');

// Папка для аватаров
const avatarsDir = path.join(__dirname, '../../uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});
const uploadAvatarMiddleware = multer({ storage: avatarStorage });

/**
 * Утилита: убрать чувствительные поля
 * @param {Object} user - Объект пользователя
 * @returns {Object} sanitized user
 */
function sanitize(user) {
  const u = { ...user };
  delete u.passwordHash;
  delete u.password_hash;
  delete u.resetToken;
  delete u.reset_token;
  delete u.resetTokenExpires;
  delete u.reset_token_expires;
  return u;
}

/**
 * Получить текущий профиль
 * @route GET /api/profile
 */
async function getCurrent(req, res) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return sendValidationError(res, 'Unauthorized');
  }

  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  if (!rows.length) {
    return sendNotFound(res, 'User not found');
  }

  sendSuccess(res, sanitize(rows[0]));
}

/**
 * Сменить пароль
 * @route POST /api/profile/change-password
 */
async function changePassword(req, res) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return sendValidationError(res, 'Unauthorized');
  }

  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return sendValidationError(res, 'oldPassword and newPassword are required');
  }

  const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  if (!rows.length) {
    return sendNotFound(res, 'User not found');
  }

  const valid = await bcrypt.compare(oldPassword, rows[0].passwordHash || rows[0].password_hash || '');
  if (!valid) {
    return sendValidationError(res, 'Неверный текущий пароль');
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);

  sendSuccess(res, { success: true, message: 'Password changed successfully' });
}

/**
 * Создать ссылку доступа
 * @route POST /api/profile/share-links
 */
async function createShareLink(req, res) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return sendValidationError(res, 'Unauthorized');
  }

  const { documentId, expiresAt } = req.body;
  if (!documentId) {
    return sendValidationError(res, 'documentId is required');
  }

  const id = crypto.randomUUID();
  const { rows } = await db.query(
    `INSERT INTO share_links (id, document_id, created_by, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [id, documentId, userId, expiresAt || null]
  );

  sendSuccess(res, { id: rows[0].id, url: `/share/${rows[0].id}`, createdAt: rows[0].createdAt });
}

/**
 * Удалить ссылку доступа
 * @route DELETE /api/profile/share-links/:linkId
 */
async function deleteShareLink(req, res) {
  const userId = req.headers['x-user-id'];
  
  await db.query(
    'DELETE FROM share_links WHERE id = $1 AND created_by = $2',
    [req.params.linkId, userId]
  );
  
  sendSuccess(res, { success: true, message: 'Share link deleted' });
}

/**
 * Получить документы пользователя
 * @route GET /api/profile/:userId/documents
 */
async function getUserDocuments(req, res) {
  const { rows } = await db.query(
    `SELECT * FROM documents WHERE uploaded_by = $1 ORDER BY date DESC`,
    [req.params.userId]
  );
  
  sendSuccess(res, rows);
}

/**
 * Получить профиль по ID
 * @route GET /api/profile/:id
 */
async function getById(req, res) {
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  
  if (!rows.length) {
    return sendNotFound(res, 'User not found');
  }

  sendSuccess(res, sanitize(rows[0]));
}

/**
 * Обновить текущий профиль
 * @route PATCH /api/profile
 */
async function updateCurrent(req, res) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return sendValidationError(res, 'Unauthorized');
  }
  req.params.id = userId;
  return update(req, res);
}

/**
 * Обновить профиль по ID
 * @route PUT /api/profile/:id
 */
async function update(req, res) {
  const { id } = req.params;
  const { name, email, phone, department, nickname, telegramToken, avatar } = req.body;

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : undefined;

  const { rows } = await db.query(
    `UPDATE users SET
       name        = COALESCE($1, name),
       email       = COALESCE($2, email),
       phone       = COALESCE($3, phone),
       department  = COALESCE($4, department),
       nickname    = COALESCE($5, nickname),
       telegram_token = COALESCE($6, telegram_token),
       initials    = COALESCE($7, initials),
       avatar      = COALESCE($8, avatar)
     WHERE id = $9 RETURNING *`,
    [name, email, phone, department, nickname, telegramToken, initials, avatar, id]
  );

  if (!rows.length) {
    return sendNotFound(res, 'User not found');
  }

  sendSuccess(res, sanitize(rows[0]));
}

/**
 * Загрузить аватар
 * @route POST /api/profile/:id/avatar
 */
async function uploadAvatar(req, res) {
  const { id } = req.params;
  
  if (!req.file) {
    return sendValidationError(res, 'No file uploaded');
  }

  const avatarUrl = `/uploads/avatars/${req.file.filename}`;

  await db.query(
    'UPDATE users SET avatar = $1 WHERE id = $2',
    [avatarUrl, id]
  );

  sendSuccess(res, { avatarUrl, message: 'Avatar uploaded successfully' });
}

// Middleware для загрузки аватара
/**
 * Загрузка аватара текущего профиля
 * @route POST /api/profile/avatar
 */
async function uploadAvatarCurrent(req, res) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return sendValidationError(res, 'Unauthorized');
  }
  req.params.id = userId;
  return uploadAvatar(req, res);
}

const avatarUploadHandler = (req, res, next) => {
  uploadAvatarMiddleware.single('avatar')(req, res, (err) => {
    if (err) {
      return sendServerError(res, 'Error uploading avatar: ' + err.message);
    }
    next();
  });
};

// Экспортируем контроллеры и роутер
module.exports = {
  getCurrent,
  changePassword,
  createShareLink,
  deleteShareLink,
  updateCurrent,
  uploadAvatarCurrent,
  getUserDocuments,
  getById,
  update,
  uploadAvatar,
  avatarUploadHandler,
};
