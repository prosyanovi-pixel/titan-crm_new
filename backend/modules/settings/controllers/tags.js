/**
 * Контроллер тегов
 */

const express = require('express');
const router = express.Router();
const db = require('../../../db');
const { asyncHandler } = require('../../../utils/errorHandler');
const { sendSuccess, sendCreated, sendNotFound, sendDeleted, sendValidationError } = require('../../../utils/responseHelpers');

/**
 * Преобразование строки БД в формат API
 */
function toTag(row) {
  return {
    id: String(row.id),
    name: row.name,
    color: row.color || '#3B82F6',
    module: row.module || undefined,
    category: row.variant || undefined, // keep for backward compatibility
    variant: row.variant || 'solid',    // badge variant (same column, but default to solid)
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
 * Получить все теги
 * @route GET /api/settings/tags
 */
async function getAll(req, res) {
  const { module } = req.query;
  let query = 'SELECT * FROM defined_tags';
  const params = [];
  
  if (module) {
    query += ' WHERE module = $1';
    params.push(module);
  }
  
  query += ' ORDER BY displayorder ASC, id ASC';
  const { rows } = await db.query(query, params);
  const tags = rows.map(toTag);
  sendSuccess(res, { items: tags, total: tags.length });
}

/**
 * Получить тег по ID
 * @route GET /api/settings/tags/:id
 */
async function getById(req, res) {
  const { rows } = await db.query('SELECT * FROM defined_tags WHERE id = $1', [req.params.id]);
  if (!rows.length) return sendNotFound(res, 'Tag not found');
  sendSuccess(res, toTag(rows[0]));
}

/**
 * Создать тег
 * @route POST /api/settings/tags
 */
async function create(req, res) {
  const { 
    name, color = '#3B82F6', module, category, variant = 'solid', size = 'md', shape = 'rounded',
    icon, isGlass = false, isGradient = false, secondaryColor, isAnimated = false
  } = req.body;
  
  if (!name?.trim()) return sendValidationError(res, 'name обязателен');

  // Generate an ID since the column does not have a default value
  const tagId = req.body.id || `tag-${Date.now()}`;
  
  const { rows } = await db.query(
    `INSERT INTO defined_tags (id, name, color, module, variant, size, shape, icon, is_glass, is_gradient, secondary_color, is_animated)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [tagId, name.trim(), color, module || null, variant, size, shape, icon || null, isGlass, isGradient, secondaryColor || null, isAnimated]
  );
  
  sendCreated(res, toTag(rows[0]));
}

/**
 * Обновить тег
 * @route PUT /api/settings/tags/:id
 */
async function update(req, res) {
  const { 
    name, color, category, variant, size, shape,
    icon, isGlass, isGradient, secondaryColor, isAnimated
  } = req.body;
  
  const { rows } = await db.query(
    `UPDATE defined_tags
     SET name            = CASE WHEN $1  THEN $2  ELSE name END,
         color           = CASE WHEN $3  THEN $4  ELSE color END,
         variant         = CASE WHEN $5  THEN $6  ELSE variant END,
         size            = CASE WHEN $7  THEN $8  ELSE size END,
         shape           = CASE WHEN $9  THEN $10 ELSE shape END,
         icon            = CASE WHEN $11 THEN $12 ELSE icon END,
         is_glass        = CASE WHEN $13 THEN $14 ELSE is_glass END,
         is_gradient     = CASE WHEN $15 THEN $16 ELSE is_gradient END,
         secondary_color = CASE WHEN $17 THEN $18 ELSE secondary_color END,
         is_animated     = CASE WHEN $19 THEN $20 ELSE is_animated END
     WHERE id = $21
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
      req.params.id
    ]
  );
  
  if (!rows.length) return sendNotFound(res, 'Tag not found');
  sendSuccess(res, toTag(rows[0]));
}

/**
 * Удалить тег
 * @route DELETE /api/settings/tags/:id
 */
async function remove(req, res) {
  const { rowCount } = await db.query('DELETE FROM defined_tags WHERE id = $1', [req.params.id]);
  if (!rowCount) return sendNotFound(res, 'Tag not found');
  sendDeleted(res);
}

// Маршруты
router.get('/', asyncHandler(getAll));
router.get('/:id', asyncHandler(getById));
router.post('/', asyncHandler(create));
router.put('/:id', asyncHandler(update));
router.delete('/:id', asyncHandler(remove));

module.exports = router;
