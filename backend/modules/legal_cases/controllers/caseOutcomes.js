const express = require('express');
const router = express.Router();
const db = require('../../../db');
const { asyncHandler } = require('../../../utils/errorHandler');

/**
 * Преобразование строки БД в объект outcome
 */
function toOutcome(row) {
  return {
    id: row.id,
    name: row.name,
    color: row.color || '#6B7280',
    order: row.displayOrder,
    description: row.description,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    variant: row.variant || 'solid',
    size: row.size || 'md',
    shape: row.shape || 'rounded',
    icon: row.icon || undefined,
    isGlass: !!row.isGlass,
    isGradient: !!row.isGradient,
    secondaryColor: row.secondaryColor || undefined,
    isAnimated: !!row.isAnimated,
  };
}

// GET /api/case-outcomes - Получить все результаты дел
router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM case_outcome ORDER BY display_order ASC, id ASC'
  );
  res.json({ items: rows.map(toOutcome), total: rows.length });
}));

// GET /api/case-outcomes/:id - Получить результат по ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM case_outcome WHERE id = $1',
    [req.params.id]
  );
  
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Outcome not found' });
  }
  
  res.json(toOutcome(rows[0]));
}));

// POST /api/case-outcomes - Создать новый результат
router.post('/', asyncHandler(async (req, res) => {
  const { 
    name, color = '#6B7280', order = 0, description, isActive = true, variant = 'solid', size = 'md', shape = 'rounded',
    icon, isGlass = false, isGradient = false, secondaryColor, isAnimated = false
  } = req.body;
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Название обязательно' });
  }
  
  // Генерируем slug ID из названия
  const id = name.trim().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-а-яё]/gu, '')
    .replace(/-+/g, '-')
    .substring(0, 50) + '-' + Date.now();
  
  const { rows } = await db.query(
    `INSERT INTO case_outcome (id, name, color, display_order, description, is_active, variant, size, shape, icon, is_glass, is_gradient, secondary_color, is_animated)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
    [id, name.trim(), color, order, description || null, isActive, variant, size, shape, icon || null, isGlass, isGradient, secondaryColor || null, isAnimated]
  );
  
  res.status(201).json(toOutcome(rows[0]));
}));

// PUT /api/case-outcomes/:id - Обновить результат
router.put('/:id', asyncHandler(async (req, res) => {
  const { 
    name, color, order, description, isActive, variant, size, shape,
    icon, isGlass, isGradient, secondaryColor, isAnimated
  } = req.body;
  
  // Проверяем существование
  const checkResult = await db.query(
    'SELECT id FROM case_outcome WHERE id = $1',
    [req.params.id]
  );
  
  if (checkResult.rows.length === 0) {
    return res.status(404).json({ error: 'Outcome not found' });
  }
  
  const { rows } = await db.query(
    `UPDATE case_outcome
     SET name          = CASE WHEN $1  THEN $2  ELSE name END,
         color         = CASE WHEN $3  THEN $4  ELSE color END,
         display_order = CASE WHEN $5  THEN $6  ELSE display_order END,
         description   = CASE WHEN $7  THEN $8  ELSE description END,
         is_active     = CASE WHEN $9  THEN $10 ELSE is_active END,
         variant       = CASE WHEN $11 THEN $12 ELSE variant END,
         size          = CASE WHEN $13 THEN $14 ELSE size END,
         shape         = CASE WHEN $15 THEN $16 ELSE shape END,
         icon          = CASE WHEN $17 THEN $18 ELSE icon END,
         is_glass      = CASE WHEN $19 THEN $20 ELSE is_glass END,
         is_gradient   = CASE WHEN $21 THEN $22 ELSE is_gradient END,
         secondary_color = CASE WHEN $23 THEN $24 ELSE secondary_color END,
         is_animated   = CASE WHEN $25 THEN $26 ELSE is_animated END,
         updated_at    = CURRENT_TIMESTAMP
     WHERE id = $27
     RETURNING *`,
    [
      name !== undefined, name || null,
      color !== undefined, color || null,
      order !== undefined, order,
      description !== undefined, description || null,
      isActive !== undefined, !!isActive,
      variant !== undefined, variant || null,
      size !== undefined, size || null,
      shape !== undefined, shape || null,
      icon !== undefined, icon || null,
      isGlass !== undefined, !!isGlass,
      isGradient !== undefined, !!isGradient,
      secondaryColor !== undefined, secondaryColor || null,
      isAnimated !== undefined, !!isAnimated,
      req.params.id
    ]
  );
  
  res.json(toOutcome(rows[0]));
}));

// DELETE /api/case-outcomes/:id - Удалить результат
router.delete('/:id', asyncHandler(async (req, res) => {
  // Проверяем существование
  const checkResult = await db.query(
    'SELECT id FROM case_outcome WHERE id = $1',
    [req.params.id]
  );
  
  if (checkResult.rows.length === 0) {
    return res.status(404).json({ error: 'Outcome not found' });
  }
  
  await db.query('DELETE FROM case_outcome WHERE id = $1', [req.params.id]);
  res.json({ success: true });
}));

// PUT /api/case-outcomes/reorder - Обновить порядок результатов
router.put('/reorder', asyncHandler(async (req, res) => {
  const { ids } = req.body;
  
  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'ids должен быть массивом' });
  }
  
  for (let i = 0; i < ids.length; i++) {
    await db.query(
      'UPDATE case_outcome SET display_order = $1 WHERE id = $2',
      [i, ids[i]]
    );
  }
  
  res.json({ success: true });
}));

module.exports = router;