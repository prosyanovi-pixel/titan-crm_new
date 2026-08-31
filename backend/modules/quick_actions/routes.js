const express = require('express');
const db = require('../../db');
const logger = require('../../utils/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM quick_actions ORDER BY module, displayorder'
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('Error fetching quick actions', err);
    res.status(500).json({ error: 'Failed to fetch quick actions' });
  }
});

router.get('/:module', async (req, res) => {
  try {
    const { module } = req.params;
    const result = await db.query(
      'SELECT * FROM quick_actions WHERE module = $1 ORDER BY displayorder',
      [module]
    );
    res.json(result.rows);
  } catch (err) {
    logger.error('Error fetching quick actions by module', err);
    res.status(500).json({ error: 'Failed to fetch quick actions' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { id, name, icon, action, module, displayOrder } = req.body;

    let nextDisplayOrder = displayOrder;
    if (nextDisplayOrder === undefined) {
      const maxOrderResult = await db.query(
        'SELECT COALESCE(MAX(displayorder), 0) + 1 as next_order FROM quick_actions WHERE module = $1',
        [module]
      );
      nextDisplayOrder = maxOrderResult.rows[0].next_order;
    }

    const result = await db.query(
      `INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING *`,
      [id || Date.now().toString(), name, icon, action, module, nextDisplayOrder]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error('Error creating quick action', err);
    res.status(500).json({ error: 'Failed to create quick action' });
  }
});

router.post('/reorder', async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      throw new Error('Invalid items array');
    }

    for (const item of items) {
      await client.query(
        'UPDATE quick_actions SET displayorder = $1 WHERE id = $2',
        [item.displayOrder, item.id]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Error reordering quick actions', err);
    res.status(500).json({ error: 'Failed to reorder actions' });
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, action, module, displayOrder, isActive } = req.body;

    const existingResult = await db.query(
      'SELECT displayorder, is_active FROM quick_actions WHERE id = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quick action not found' });
    }

    const existing = existingResult.rows[0];
    const finalDisplayOrder = displayOrder ?? existing.displayorder;
    const finalIsActive = isActive ?? existing.is_active;

    const result = await db.query(
      `UPDATE quick_actions 
       SET name = $1, icon = $2, action = $3, module = $4, displayorder = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, icon, action, module, finalDisplayOrder, finalIsActive, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Error updating quick action', err);
    res.status(500).json({ error: 'Failed to update quick action' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM quick_actions WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quick action not found' });
    }

    res.json({ message: 'Quick action deleted successfully' });
  } catch (err) {
    logger.error('Error deleting quick action', err);
    res.status(500).json({ error: 'Failed to delete quick action' });
  }
});

module.exports = router;