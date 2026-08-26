const express = require('express');
const bcrypt = require('bcrypt');

const db = require('../../../../db');
const logger = require('../../../../utils/logger');
const {
  getUsersList,
  blockUser,
  unblockUser,
} = require('./usersHelpers');

const router = express.Router();

router.get('/users', async (req, res) => {
  try {
    res.json(await getUsersList());
  } catch (err) {
    logger.error('admin: users list error', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/users/:id/block', async (req, res) => {
  try {
    const user = await blockUser(req.params.id, req.headers['x-user-id'], req.body.reason);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users/:id/unblock', async (req, res) => {
  try {
    const user = await unblockUser(req.params.id, req.headers['x-user-id']);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const {
      name, email, role, status, phone, department,
      nickname, avatar, initials, password,
    } = req.body;

    if (role && role !== 'admin') {
      const { rows: currentRows } = await db.query('SELECT role FROM users WHERE id = $1', [req.params.id]);
      if (currentRows[0]?.role === 'admin') {
        logger.warn(`admin: attempt to change admin role for user ${req.params.id}`);
      }
    }

    const updateInitials = initials || (name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : undefined);

    const params = [
      name || null,
      email || null,
      role || null,
      status || null,
      phone || null,
      department || null,
      nickname || null,
      avatar || null,
      updateInitials || null,
      req.params.id,
    ];

    let passwordClause = '';

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      passwordClause = `, password_hash = $11`;
      params.push(passwordHash);
    }

    const { rows } = await db.query(
      `UPDATE users SET
         name = COALESCE($1, name),
         email = COALESCE($2, email),
         role = COALESCE($3, role),
         status = COALESCE($4, status),
         phone = COALESCE($5, phone),
         department = COALESCE($6, department),
         nickname = COALESCE($7, nickname),
         avatar = COALESCE($8, avatar),
         initials = COALESCE($9, initials)${passwordClause}
       WHERE id = $10
       RETURNING *`,
      params
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });

    const enriched = await db.query(`
      SELECT
        u.*,
        e.id AS employee_id,
        p.name AS position_name,
        d.name AS department_name
      FROM users u
      LEFT JOIN employees e ON e.user_id = u.id::text
      LEFT JOIN positions p ON p.id = e.position_id
      LEFT JOIN departments d ON d.id = e.department_id
      WHERE u.id = $1
    `, [req.params.id]);

    const user = enriched.rows[0];
    delete user.passwordHash;
    delete user.password_hash;
    delete user.resetToken;
    delete user.resetTokenExpires;

    logger.info(`admin: user ${req.params.id} updated by ${req.headers['x-user-id'] || 'system'}`);
    res.json({ success: true, user });
  } catch (err) {
    logger.error('admin: PUT /users/:id error', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUserId = req.headers['x-user-id'];

    if (userId === currentUserId) {
      return res.status(400).json({ error: 'Нельзя удалить самого себя' });
    }

    const { rows: empRows } = await db.query(
      'SELECT id FROM employees WHERE user_id = $1',
      [userId]
    );
    if (empRows.length > 0) {
      return res.status(400).json({
        error: 'Нельзя удалить пользователя, связанного с сотрудником. Сначала удалите связь в карточке сотрудника.',
      });
    }

    const { rowCount } = await db.query('DELETE FROM users WHERE id = $1', [userId]);
    if (!rowCount) return res.status(404).json({ error: 'Пользователь не найден' });

    logger.info(`admin: user ${userId} deleted by ${currentUserId || 'system'}`);
    res.json({ success: true });
  } catch (err) {
    logger.error('admin: DELETE /users/:id error', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const {
      name, email, password, role = 'user', status = 'active',
      phone, department, nickname, avatar,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'name и email обязательны' });
    }

    const { rows: existingRows } = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existingRows.length > 0) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    const id = 'user-' + Date.now();
    const initials = avatar || (name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U');
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    const { rows } = await db.query(
      `INSERT INTO users (
         id, name, email, password_hash, role, status,
         phone, department, nickname, avatar, initials
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [id, name, email, passwordHash, role, status, phone, department, nickname, avatar, initials]
    );

    const user = rows[0];
    delete user.passwordHash;
    delete user.password_hash;
    delete user.resetToken;
    delete user.resetTokenExpires;

    logger.info(`admin: user ${id} created by ${req.headers['x-user-id'] || 'system'}`);
    res.status(201).json({ success: true, user });
  } catch (err) {
    logger.error('admin: POST /users error', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;