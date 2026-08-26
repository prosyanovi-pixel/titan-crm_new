const express = require('express');
const router = express.Router();
const db = require('../../../db');
const { asyncHandler } = require('../../../utils/errorHandler');
const {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendDeleted,
  sendValidationError,
} = require('../../../utils/responseHelpers');

function toStage(row) {
  return {
    id: String(row.id),
    name: row.name,
    displayorder: row.displayorder,
    color: row.color || '#6B7280',
    variant: row.variant || 'solid',
  };
}

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/giu, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

async function makeUniqueId(name) {
  const base = slugify(name) || 'stage';
  let candidate = base;
  let suffix = 2;

  // Keep ids stable and unique so project.stage references stay valid.
  while (true) {
    const { rows } = await db.query('SELECT 1 FROM project_stage WHERE id = $1 LIMIT 1', [candidate]);
    if (rows.length === 0) {
      return candidate;
    }
    candidate = `${base}_${suffix}`;
    suffix += 1;
  }
}

async function getAll(req, res) {
  const { rows } = await db.query('SELECT * FROM project_stage ORDER BY displayorder ASC, id ASC');
  const items = rows.map(toStage);
  sendSuccess(res, { items, total: items.length });
}

async function getById(req, res) {
  const { rows } = await db.query('SELECT * FROM project_stage WHERE id = $1', [req.params.id]);
  if (!rows.length) {
    return sendNotFound(res, 'Project stage not found');
  }
  sendSuccess(res, toStage(rows[0]));
}

async function create(req, res) {
  const { name, order = 0, color, variant } = req.body;

  if (!name || !String(name).trim()) {
    return sendValidationError(res, 'name обязателен');
  }

  const id = await makeUniqueId(name);
  const { rows } = await db.query(
    'INSERT INTO project_stage (id, name, displayorder, color, variant) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [
      id, 
      String(name).trim(), 
      Number.isFinite(Number(order)) ? Number(order) : 0, 
      color || '#6B7280',
      variant || 'solid'
    ]
  );

  sendCreated(res, toStage(rows[0]));
}

async function update(req, res) {
  const { name, order, color, variant } = req.body;
  const updates = [];
  const values = [];
  let index = 1;

  if (name !== undefined) {
    if (!String(name).trim()) {
      return sendValidationError(res, 'name не может быть пустым');
    }
    updates.push(`name = $${index++}`);
    values.push(String(name).trim());
  }

  if (order !== undefined) {
    updates.push(`displayorder = $${index++}`);
    values.push(Number.isFinite(Number(order)) ? Number(order) : 0);
  }

  if (color !== undefined) {
    updates.push(`color = $${index++}`);
    values.push(color || '#6B7280');
  }

  if (variant !== undefined) {
    updates.push(`variant = $${index++}`);
    values.push(variant || 'solid');
  }

  if (updates.length === 0) {
    return sendValidationError(res, 'Нет полей для обновления');
  }

  values.push(req.params.id);
  const { rows } = await db.query(
    `UPDATE project_stage SET ${updates.join(', ')} WHERE id = $${index} RETURNING *`,
    values
  );

  if (!rows.length) {
    return sendNotFound(res, 'Project stage not found');
  }

  sendSuccess(res, toStage(rows[0]));
}

async function remove(req, res) {
  const usage = await db.query('SELECT COUNT(*)::int AS count FROM projects WHERE stage = $1', [req.params.id]);
  if (usage.rows[0]?.count > 0) {
    return sendValidationError(res, 'Нельзя удалить стадию, пока она используется в проектах');
  }

  const result = await db.query('DELETE FROM project_stage WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows.length) {
    return sendNotFound(res, 'Project stage not found');
  }

  sendDeleted(res);
}

async function reorder(req, res) {
  const { ids } = req.body;
  if (!Array.isArray(ids)) {
    return sendValidationError(res, 'ids обязателен (массив)');
  }

  for (let i = 0; i < ids.length; i += 1) {
    await db.query('UPDATE project_stage SET displayorder = $1 WHERE id = $2', [i, ids[i]]);
  }

  sendSuccess(res, { success: true });
}

router.get('/', asyncHandler(getAll));
router.get('/:id', asyncHandler(getById));
router.post('/', asyncHandler(create));
router.put('/reorder', asyncHandler(reorder));
router.put('/:id', asyncHandler(update));
router.delete('/:id', asyncHandler(remove));

module.exports = router;
