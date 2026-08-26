
const express = require('express');
const router = express.Router();
const db = require('../../db');
const bcrypt = require('bcrypt');
const logger = require('../../utils/logger');

// Get current user profile
router.get('/me', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || '2'; 

        const { rows } = await db.query(`
            SELECT
                u.*,
                e.id            AS employee_id,
                e.position_id   AS employee_position_id,
                p.name          AS employee_position_name,
                e.department_id AS employee_department_id,
                d.name          AS employee_department_name,
                e.telegram_id   AS employee_telegram_id
            FROM users u
            LEFT JOIN employees e ON e.user_id = u.id::text
            LEFT JOIN positions  p ON p.id = e.position_id
            LEFT JOIN departments d ON d.id = e.department_id
            WHERE u.id = $1
        `, [userId]);

        if (rows.length === 0) return res.status(404).json({ error: "User not found" });

        const u = rows[0];
        // Remove sensitive data
        delete u.passwordHash;
        delete u.resetToken;
        delete u.resetTokenExpires;
        
        res.json(u);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update current user profile
router.put('/me', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || '2';
        const { name, email, phone, department, nickname, telegramToken } = req.body; 

        const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : undefined;

        const { rows } = await db.query(
            `UPDATE users 
             SET name = COALESCE($1, name), 
                 email = COALESCE($2, email), 
                 phone = COALESCE($3, phone),
                 department = COALESCE($4, department),
                 nickname = COALESCE($5, nickname),
                 telegram_token = COALESCE($6, telegram_token),
                 initials = COALESCE($7, initials)
             WHERE id = $8 
             RETURNING *`,
            [name, email, phone, department, nickname, telegramToken, initials, userId]
        );

        if (rows.length === 0) return res.status(404).json({error: "User not found"});

        // Синхронизируем phone и telegram_id в привязанной карточке сотрудника
        try {
            await db.query(
                `UPDATE employees
                 SET phone       = COALESCE($1, phone),
                     telegram_id = COALESCE($2, telegram_id)
                 WHERE user_id = $3`,
                [phone || null, telegramToken || null, userId]
            );
        } catch (syncErr) {
            logger.warn('[users] PUT /me — не удалось синхронизировать employees:', syncErr.message);
        }

        const u = rows[0];
        delete u.passwordHash;
        delete u.resetToken;
        delete u.resetTokenExpires;

        res.json(u);
    } catch(err) {
        logger.error('Error in user operation', err);
        res.status(500).json({error: err.message});
    }
});

// Change Password
router.put('/me/change-password', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'] || '2';
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'currentPassword and newPassword are required' });
        }

        const { rows } = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        if (!rows.length) return res.status(404).json({ error: 'User not found' });

        const valid = await bcrypt.compare(currentPassword, rows[0].passwordHash || rows[0].password_hash || '');
        if (!valid) return res.status(400).json({ error: 'Неверный текущий пароль' });

        const hash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);

        res.json({ success: true });
    } catch(err) {
        res.status(500).json({error: err.message});
    }
});

// Get all users
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(`
        SELECT u.id, u.name, u.email, u.phone, u.role, u.status, u.avatar, u.initials,
               u.department, u.nickname, u.telegram_token,
               e.position_id, e.department_id,
               p.name AS position_name,
               d.name AS department_name
        FROM users u
        LEFT JOIN employees e ON e.user_id = u.id::text
        LEFT JOIN positions p ON p.id = e.position_id
        LEFT JOIN departments d ON d.id = e.department_id
        ORDER BY u.name
    `);
    
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create user
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, role, status, department, nickname, telegramToken, password } = req.body;
        const id = 'user-' + Date.now();
        const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
        const passwordHash = password ? await bcrypt.hash(password, 10) : null;

        const { rows } = await db.query(
            `INSERT INTO users (id, name, email, phone, role, status, department, nickname, telegram_token, initials, avatar, password_hash)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, $11) RETURNING *`,
            [id, name, email, phone, role || 'user', status || 'active', department, nickname, telegramToken,
             initials, passwordHash]
        );
        
        const u = rows[0];
        delete u.resetToken;
        delete u.resetTokenExpires;
        delete u.passwordHash;
        
        res.json(u);
    } catch(err) {
        logger.error('Error creating user', err);
        res.status(500).json({error: err.message});
    }
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, role, status, department, nickname, telegramToken } = req.body;
        
        const initials = name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : undefined;

        const { rows } = await db.query(
            `UPDATE users SET
                name=$1, email=$2, phone=$3, role=$4, status=$5, department=$6,
                nickname=$7, telegram_token=$8, initials=$9
             WHERE id=$10
             RETURNING *`,
            [name, email, phone, role, status, department, nickname, telegramToken, initials, id]
        );
        
        if (rows.length === 0) return res.status(404).json({error: "User not found"});

        // Возвращаем с JOIN'ами для position_name / department_name
        const enriched = await db.query(`
            SELECT u.*, e.position_id, e.department_id, p.name AS position_name, d.name AS department_name
            FROM users u
            LEFT JOIN employees e ON e.user_id = u.id::text
            LEFT JOIN positions p ON p.id = e.position_id
            LEFT JOIN departments d ON d.id = e.department_id
            WHERE u.id = $1
        `, [id]);

        const u = enriched.rows[0];
        delete u.resetToken;
        delete u.resetTokenExpires;
        delete u.passwordHash;
        delete u.password_hash;

        res.json(u);
    } catch(err) {
        res.status(500).json({error: err.message});
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        res.json({success: true});
    } catch(err) {
        res.status(500).json({error: err.message});
    }
});

module.exports = router;
