const express = require('express');
const router = express.Router();
const db = require('../../db');

// GET /income-categories
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM finance_income_categories ORDER BY name`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /income-categories
router.post('/', async (req, res) => {
  try {
    const { name, parentId, color } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });

    const id = `inc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const { rows } = await db.query(
      `INSERT INTO finance_income_categories (id, name, parent_id, color)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [id, name.trim(), parentId || null, color || null]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
