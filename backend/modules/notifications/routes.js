const express = require('express');
const router = express.Router();
const db = require('../../db');
const logger = require('../../utils/logger');

// Get all notifications for the authenticated user
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { rows } = await db.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );

    res.json(rows);
  } catch (err) {
    logger.error('Error fetching notifications', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark a notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ success: true });
  } catch (err) {
    logger.error('Error marking notification as read', err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all notifications as read
router.patch('/read-all', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );

    res.json({ success: true });
  } catch (err) {
    logger.error('Error marking all notifications as read', err);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ success: true });
  } catch (err) {
    logger.error('Error deleting notification', err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

module.exports = router;