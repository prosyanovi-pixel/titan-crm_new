/**
 * Роуты для работы с категориями доходов/расходов (categories)
 */

const express = require('express');
const router = express.Router();
const db = require('../../db');

// GET /categories - список категорий с фильтрацией по виду
router.get('/', async (req, res) => {
  try {
    const { kind } = req.query;
    const params = [];
    let where = '';
    if (kind) {
      params.push(kind);
      where = `WHERE kind = $1`;
    }
    const { rows } = await db.query(
      `SELECT * FROM finance_expense_categories ${where} ORDER BY kind, name`,
      params
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /categories - создать новую категорию
router.post('/', async (req, res) => {
  try {
    const { name, kind, parentId, color } = req.body || {};
    if (!name || !kind) return res.status(400).json({ error: 'name and kind are required' });

    const id = `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const { rows } = await db.query(
      `INSERT INTO finance_expense_categories (id, name, kind, parent_id, color)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [id, name.trim(), kind, parentId || null, color || null]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /categories/:id - обновить категорию
router.put('/:id', async (req, res) => {
  try {
    const { name, kind, parentId, color } = req.body || {};
    const { rows } = await db.query(
      `UPDATE finance_expense_categories
       SET name = COALESCE($1, name),
           kind = COALESCE($2, kind),
           parent_id = $3,
           color = $4
       WHERE id = $5 RETURNING *`,
      [name || null, kind || null, parentId || null, color || null, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /categories/:id - удалить категорию
router.delete('/:id', async (req, res) => {
  try {
    const check = await db.query(
      'SELECT is_system FROM finance_expense_categories WHERE id = $1',
      [req.params.id]
    );
    if (check.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    if (check.rows[0].isSystem || check.rows[0].is_system) {
      return res.status(400).json({ error: 'Cannot delete system category' });
    }

    // 1. Сбрасываем ссылки в платежах
    await db.query('UPDATE finance_payments SET category_id = NULL WHERE category_id = $1', [req.params.id]);

    // 2. Сбрасываем ссылки в строках банковских выписок
    await db.query('UPDATE finance_statement_lines SET category_id = NULL WHERE category_id = $1', [req.params.id]);

    // 3. Удаляем саму категорию
    await db.query('DELETE FROM finance_expense_categories WHERE id = $1', [req.params.id]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
