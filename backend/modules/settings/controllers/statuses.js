/**
 * Контроллер статусов
 * Управляет статусами для различных модулей (contractors, projects, tasks и т.д.)
 */

const express = require('express');
const router = express.Router();
const db = require('../../../db');
const { asyncHandler } = require('../../../utils/errorHandler');
const { sendSuccess, sendCreated, sendNotFound, sendDeleted, sendValidationError } = require('../../../utils/responseHelpers');

// Карта модулей и их таблиц статусов
const MODULE_TABLE = {
  contractors: 'contractor_status',
  projects:    'project_status',
  tasks:       'task_status',
  lawyers:     'lawyer_status',
  cases:       'case_status',
  finance:     'finance_invoice_status',
  calendar:    'calendar_status',
  contracts:   'contract_status',
  contracts_payment: 'contract_payment_status',
  reports: 'report_status',
  products:    'product_status',
  services:    'service_status',
  quotes:      'quote_status',
  price_lists: 'price_list_status',
};

/**
 * Преобразование строки БД в формат API
 */
function toStatus(row, module) {
  return {
    id: String(row.id),
    name: row.name,
    color: row.color || '#6B7280',
    order: row.displayorder,
    module: module || row.module || undefined,
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
 * Поиск таблицы по ID статуса
 */
async function findTableForId(id) {
  for (const [module, table] of Object.entries(MODULE_TABLE)) {
    try {
      const { rows } = await db.query(`SELECT id FROM ${table} WHERE id = $1`, [id]);
      if (rows.length) return { module, table };
    } catch {
      // Таблица может не существовать
    }
  }
  return null;
}

/**
 * Получить все статусы (с фильтрацией по модулю)
 * @route GET /api/settings/statuses
 */
async function getAll(req, res) {
  const { module } = req.query;

  if (module) {
    const table = MODULE_TABLE[module];
    if (!table) return sendSuccess(res, { items: [], total: 0 });
    
    try {
      const { rows } = await db.query(`SELECT * FROM ${table} ORDER BY displayorder ASC, id ASC`);
      const statuses = rows.map(r => toStatus(r, module));
      return sendSuccess(res, { items: statuses, total: statuses.length });
    } catch {
      return sendSuccess(res, { items: [], total: 0 });
    }
  }

  // Сбор всех статусов из всех таблиц
  const all = [];
  for (const [mod, table] of Object.entries(MODULE_TABLE)) {
    try {
      const { rows } = await db.query(`SELECT * FROM ${table} ORDER BY displayorder ASC, id ASC`);
      rows.forEach(r => all.push(toStatus(r, mod)));
    } catch {
      // Пропускаем отсутствующие таблицы
    }
  }
  sendSuccess(res, { items: all, total: all.length });
}

/**
 * Получить статус по ID
 * @route GET /api/settings/statuses/:id
 */
async function getById(req, res) {
  const found = await findTableForId(req.params.id);
  if (!found) return sendNotFound(res, 'Status not found');
  
  const { rows } = await db.query(`SELECT * FROM ${found.table} WHERE id = $1`, [req.params.id]);
  sendSuccess(res, toStatus(rows[0], found.module));
}

/**
 * Создать статус
 * @route POST /api/settings/statuses
 */
async function create(req, res) {
  const { 
    name, color = '#6B7280', module, order = 0, variant = 'solid', size = 'md', shape = 'rounded',
    icon, isGlass = false, isGradient = false, secondaryColor, isAnimated = false
  } = req.body;
  
  if (!name?.trim()) return sendValidationError(res, 'name обязателен');
  if (!module) return sendValidationError(res, 'module обязателен');
  
  const table = MODULE_TABLE[module];
  if (!table) return sendValidationError(res, `Unknown module: ${module}`);

  // Генерация ID из имени
  const id = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-а-яё]/gu, '') + '-' + Date.now();

  const { rows } = await db.query(
    `INSERT INTO ${table} (id, name, color, displayorder, variant, size, shape, icon, is_glass, is_gradient, secondary_color, is_animated) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
    [id, name.trim(), color, order, variant, size, shape, icon || null, isGlass, isGradient, secondaryColor || null, isAnimated]
  );
  
  sendCreated(res, toStatus(rows[0], module));
}

/**
 * Обновить статус
 * @route PUT /api/settings/statuses/:id
 */
async function update(req, res) {
  const { 
    name, color, variant, size, shape,
    icon, isGlass, isGradient, secondaryColor, isAnimated
  } = req.body;
  const found = await findTableForId(req.params.id);
  
  if (!found) return sendNotFound(res, 'Status not found');

  const { rows } = await db.query(
    `UPDATE ${found.table}
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
  
  sendSuccess(res, toStatus(rows[0], found.module));
}

/**
 * Удалить статус
 * @route DELETE /api/settings/statuses/:id
 */
async function remove(req, res) {
  const found = await findTableForId(req.params.id);
  if (!found) return sendNotFound(res, 'Status not found');
  
  await db.query(`DELETE FROM ${found.table} WHERE id = $1`, [req.params.id]);
  sendDeleted(res);
}

/**
 * Изменить порядок статусов
 * @route PUT /api/settings/statuses/reorder
 */
async function reorder(req, res) {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return sendValidationError(res, 'ids обязателен (массив)');

  for (let i = 0; i < ids.length; i++) {
    const found = await findTableForId(ids[i]);
    if (found) {
      await db.query(`UPDATE ${found.table} SET displayorder = $1 WHERE id = $2`, [i, ids[i]]);
    }
  }
  sendSuccess(res, { success: true });
}

// Маршруты
router.get('/', asyncHandler(getAll));
router.get('/:id', asyncHandler(getById));
router.post('/', asyncHandler(create));
router.put('/reorder', asyncHandler(reorder));
router.put('/:id', asyncHandler(update));
router.delete('/:id', asyncHandler(remove));

module.exports = router;
