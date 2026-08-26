/**
 * Контроллер приоритетов
 */

const express = require('express');
const router = express.Router();
const db = require('../../../db');
const { asyncHandler } = require('../../../utils/errorHandler');
const { sendSuccess, sendCreated, sendNotFound, sendDeleted, sendValidationError } = require('../../../utils/responseHelpers');

const DEFAULT_COLORS = { High: '#EF4444', Medium: '#F59E0B', Low: '#3B82F6' };
const LEVEL_MAP = { High: 3, Medium: 2, Low: 1 };

/**
 * Преобразование строки БД в формат API
 */
function toPriority(row) {
  return {
    id: String(row.id),
    name: row.name,
    color: row.color || DEFAULT_COLORS[row.id] || '#6B7280',
    level: LEVEL_MAP[row.id] ?? row.level ?? 1,
    order: row.displayorder,
    module: row.module || undefined,
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

/**
 * Получить все приоритеты
 * @route GET /api/settings/priorities
 */
async function getAll(req, res) {
  const { module } = req.query;
  let queryText = 'SELECT * FROM priority';
  const params = [];

  if (module) {
    queryText += ' WHERE module = $1';
    params.push(module);
  }

  queryText += ' ORDER BY displayorder ASC';
  const { rows } = await db.query(queryText, params);
  const priorities = rows.map(toPriority);
  sendSuccess(res, { items: priorities, total: priorities.length });
}

/**
 * Получить приоритет по ID
 * @route GET /api/settings/priorities/:id
 */
async function getById(req, res) {
  const { rows } = await db.query('SELECT * FROM priority WHERE id = $1', [req.params.id]);
  if (!rows.length) return sendNotFound(res, 'Priority not found');
  sendSuccess(res, toPriority(rows[0]));
}

/**
 * Создать приоритет
 * @route POST /api/settings/priorities
 */
async function create(req, res) {
  const { 
    name, color, level = 1, order = 0, module, variant = 'solid', size = 'md', shape = 'rounded',
    icon, isGlass = false, isGradient = false, secondaryColor, isAnimated = false
  } = req.body;
  if (!name?.trim()) return sendValidationError(res, 'name обязателен');
  
  const id = name.trim().replace(/\s+/g, '');

  const { rows } = await db.query(
    `INSERT INTO priority (id, name, displayorder, color, variant, size, shape, icon, is_glass, is_gradient, secondary_color, is_animated, module)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     ON CONFLICT (id) DO UPDATE SET 
        name            = EXCLUDED.name, 
        color           = EXCLUDED.color, 
        variant         = EXCLUDED.variant, 
        size            = EXCLUDED.size, 
        shape           = EXCLUDED.shape,
        icon            = EXCLUDED.icon,
        is_glass        = EXCLUDED.is_glass,
        is_gradient     = EXCLUDED.is_gradient,
        secondary_color = EXCLUDED.secondary_color,
        is_animated     = EXCLUDED.is_animated,
        module          = EXCLUDED.module
     RETURNING *`,
    [id, name.trim(), order, color || DEFAULT_COLORS[id] || '#6B7280', variant, size, shape, icon || null, isGlass, isGradient, secondaryColor || null, isAnimated, module || null]
  );
  
  sendCreated(res, toPriority(rows[0]));
}

/**
 * Обновить приоритет
 * @route PUT /api/settings/priorities/:id
 */
async function update(req, res) {
  const { 
    name, color, module, variant, size, shape,
    icon, isGlass, isGradient, secondaryColor, isAnimated
  } = req.body;
  
  const { rows } = await db.query(
    `UPDATE priority
     SET name            = CASE WHEN $1  THEN $2  ELSE name END,
         color           = CASE WHEN $3  THEN $4  ELSE color END,
         variant         = CASE WHEN $5  THEN $6  ELSE variant END,
         size            = CASE WHEN $7  THEN $8  ELSE size END,
         shape           = CASE WHEN $9  THEN $10 ELSE shape END,
         icon            = CASE WHEN $11 THEN $12 ELSE icon END,
         is_glass        = CASE WHEN $13 THEN $14 ELSE is_glass END,
         is_gradient     = CASE WHEN $15 THEN $16 ELSE is_gradient END,
         secondary_color = CASE WHEN $17 THEN $18 ELSE secondary_color END,
         is_animated     = CASE WHEN $19 THEN $20 ELSE is_animated END,
         module          = CASE WHEN $21 THEN $22 ELSE module END
     WHERE id = $23
     RETURNING *`,
    [
      name !== undefined, name || null,
      color !== undefined, color || null,
      variant !== undefined, variant || null,
      size !== undefined, size || null,
      shape !== undefined, shape || null,
      icon !== undefined, icon || null,
      isGlass !== undefined, !!isGlass,
      isGradient !== undefined, !!isGradient,
      secondaryColor !== undefined, secondaryColor || null,
      isAnimated !== undefined, !!isAnimated,
      module !== undefined, module || null,
      req.params.id
    ]
  );
  
  if (!rows.length) return sendNotFound(res, 'Priority not found');
  sendSuccess(res, toPriority(rows[0]));
}

/**
 * Удалить приоритет
 * @route DELETE /api/settings/priorities/:id
 */
async function remove(req, res) {
  const { rowCount } = await db.query('DELETE FROM priority WHERE id = $1', [req.params.id]);
  if (!rowCount) return sendNotFound(res, 'Priority not found');
  sendDeleted(res);
}

/**
 * Изменить порядок приоритетов
 * @route PUT /api/settings/priorities/reorder
 */
async function reorder(req, res) {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return sendValidationError(res, 'ids обязателен (массив)');
  
  await Promise.all(ids.map((id, i) => db.query('UPDATE priority SET displayorder = $1 WHERE id = $2', [i, id])));
  
  const { rows } = await db.query('SELECT * FROM priority ORDER BY displayorder ASC');
  const priorities = rows.map(toPriority);
  sendSuccess(res, { items: priorities, total: priorities.length });
}

// Маршруты
router.get('/', asyncHandler(getAll));
router.get('/:id', asyncHandler(getById));
router.post('/', asyncHandler(create));
router.put('/reorder', asyncHandler(reorder));
router.put('/:id', asyncHandler(update));
router.delete('/:id', asyncHandler(remove));

module.exports = router;
