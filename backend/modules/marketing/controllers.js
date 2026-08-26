/**
 * Контроллеры модуля Marketing
 * Обработчики HTTP-запросов для управления маркетинговыми кампаниями
 */

const { asyncHandler } = require('../../utils/errorHandler');
const { sendSuccess, sendCreated, sendNotFound, sendDeleted, sendValidationError, sendPaginated } = require('../../utils/responseHelpers');
const db = require('../../db');
const { getModuleSettings } = require('../../utils/moduleSettingsLoader');
const { logAction } = require('../../utils/auditLogger');

/**
 * Получить все кампании
 * @route GET /api/marketing
 */
const getAll = asyncHandler(async (req, res) => {
  const { search, status, type, page, limit, sortField, sortOrder } = req.query;

  const settings = await getModuleSettings('marketing');
  const defaultLimit = settings.display?.itemsPerPage || 20;
  const currentPage = Math.max(1, parseInt(page) || 1);
  const currentLimit = Math.min(parseInt(limit) || defaultLimit, 200);
  const offset = (currentPage - 1) * currentLimit;

  const whereClauses = ['mc.deleted_at IS NULL'];
  const values = [];
  let idx = 1;

  if (search && search.trim()) {
    whereClauses.push(`(mc.name ILIKE $${idx} OR mc.description ILIKE $${idx} OR mc.target_audience ILIKE $${idx})`);
    values.push(`%${search.trim()}%`);
    idx++;
  }

  if (status) {
    whereClauses.push(`mc.status = $${idx}`);
    values.push(status);
    idx++;
  }

  if (type) {
    whereClauses.push(`mc.type = $${idx}`);
    values.push(type);
    idx++;
  }

  const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Count total
  const { rows: countRows } = await db.query(`SELECT COUNT(*) FROM marketing_campaigns mc ${where}`, values);
  const total = parseInt(countRows[0].count);

  // Sorting
  const allowedFields = ['name', 'status', 'type', 'budget', 'actualCost', 'startDate', 'endDate', 'createdAt'];
  let dbSortField = 'mc.id';
  if (sortField) {
    if (sortField === 'actualCost') dbSortField = 'COALESCE(fp.actual_cost, 0)';
    else if (sortField === 'startDate') dbSortField = 'mc.start_date';
    else if (sortField === 'endDate') dbSortField = 'mc.end_date';
    else if (sortField === 'createdAt') dbSortField = 'mc.created_at';
    else if (allowedFields.includes(sortField)) dbSortField = `mc.${sortField}`;
  }
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

  // Query campaigns with actual cost from linked payments
  const queryText = `
    SELECT 
      mc.id, mc.name, mc.description, mc.status, mc.type, mc.budget,
      COALESCE((SELECT SUM(fp.amount) FROM finance_payments fp WHERE fp.campaign_id = mc.id AND fp.kind = 'expense'), 0)::numeric AS actual_cost,
      mc.start_date, mc.end_date, mc.target_audience, mc.created_by, mc.created_at, mc.updated_at
    FROM marketing_campaigns mc
    ${where} 
    ORDER BY ${dbSortField} ${order} 
    LIMIT $${idx} OFFSET $${idx + 1}
  `;
  const { rows: campaigns } = await db.query(queryText, [...values, currentLimit, offset]);

  sendPaginated(res, campaigns, {
    page: currentPage,
    limit: currentLimit,
    total,
  });
});

/**
 * Получить кампанию по ID
 * @route GET /api/marketing/:id
 */
const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await db.query(
    `SELECT mc.id, mc.name, mc.description, mc.status, mc.type, mc.budget,
            COALESCE((SELECT SUM(fp.amount) FROM finance_payments fp WHERE fp.campaign_id = mc.id AND fp.kind = 'expense'), 0)::numeric AS actual_cost,
            mc.start_date, mc.end_date, mc.target_audience, mc.created_by, mc.created_at, mc.updated_at
     FROM marketing_campaigns mc
     WHERE mc.id = $1`,
    [id]
  );

  if (rows.length === 0) {
    return sendNotFound(res, 'Campaign not found');
  }

  // Fetch linked payments
  const { rows: payments } = await db.query(
    `SELECT fp.id, fp.amount, fp.payment_date, fp.kind, fp.comment, fp.created_at,
            c.name AS contractor_name
     FROM finance_payments fp
     LEFT JOIN contractors c ON c.id = fp.contractor_id
     WHERE fp.campaign_id = $1
     ORDER BY fp.payment_date DESC`,
    [id]
  );

  const campaign = rows[0];
  campaign.payments = payments || [];

  sendSuccess(res, campaign);
});

/**
 * Создать новую кампанию
 * @route POST /api/marketing
 */
const create = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    status,
    type,
    budget,
    actualCost,
    startDate,
    endDate,
    targetAudience,
  } = req.body;

  if (!name) {
    return sendValidationError(res, 'Name is required');
  }
  if (!type) {
    return sendValidationError(res, 'Type is required');
  }

  const userId = req.headers['x-user-id'] || null;

  const { rows } = await db.query(
    `INSERT INTO marketing_campaigns (
      name, description, status, type, budget, actual_cost, start_date, end_date, target_audience, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      name,
      description || null,
      status || 'draft',
      type,
      budget || 0.00,
      actualCost || 0.00,
      startDate || null,
      endDate || null,
      targetAudience || null,
      userId,
    ]
  );

  const campaign = rows[0];

  // Log action
  await logAction({
    userId,
    action: 'CREATE',
    entityType: 'marketing_campaign',
    entityId: campaign.id,
    newData: campaign,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  sendCreated(res, campaign);
});

/**
 * Обновить существующую кампанию
 * @route PUT /api/marketing/:id
 */
const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    status,
    type,
    budget,
    actualCost,
    startDate,
    endDate,
    targetAudience,
  } = req.body;

  if (!name) {
    return sendValidationError(res, 'Name is required');
  }
  if (!type) {
    return sendValidationError(res, 'Type is required');
  }

  const { rows: oldRows } = await db.query('SELECT * FROM marketing_campaigns WHERE id = $1', [id]);
  if (oldRows.length === 0) {
    return sendNotFound(res, 'Campaign not found');
  }
  const oldCampaign = oldRows[0];

  const { rows } = await db.query(
    `UPDATE marketing_campaigns SET
      name = $1,
      description = $2,
      status = $3,
      type = $4,
      budget = $5,
      actual_cost = $6,
      start_date = $7,
      end_date = $8,
      target_audience = $9
    WHERE id = $10 RETURNING *`,
    [
      name,
      description || null,
      status || 'draft',
      type,
      budget || 0.00,
      actualCost || 0.00,
      startDate || null,
      endDate || null,
      targetAudience || null,
      id,
    ]
  );

  const updatedCampaign = rows[0];
  const userId = req.headers['x-user-id'] || null;

  // Log action
  await logAction({
    userId,
    action: 'UPDATE',
    entityType: 'marketing_campaign',
    entityId: id,
    oldData: oldCampaign,
    newData: updatedCampaign,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  sendSuccess(res, updatedCampaign);
});

/**
 * Удалить кампанию
 * @route DELETE /api/marketing/:id
 */
const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { rows: oldRows } = await db.query('SELECT * FROM marketing_campaigns WHERE id = $1', [id]);
  if (oldRows.length === 0) {
    return sendNotFound(res, 'Campaign not found');
  }
  const oldCampaign = oldRows[0];
  const userId = req.headers['x-user-id'] || null;

  await db.query('UPDATE marketing_campaigns SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);

  // Log action
  await logAction({
    userId,
    action: 'DELETE',
    entityType: 'marketing_campaign',
    entityId: id,
    oldData: oldCampaign,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  sendDeleted(res);
});

/**
 * Массовое удаление кампаний
 * @route POST /api/marketing/bulk-delete
 */
const bulkDelete = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || ids.length === 0) {
    return sendSuccess(res, { deletedCount: 0 });
  }

  const result = await db.query('UPDATE marketing_campaigns SET deleted_at = CURRENT_TIMESTAMP WHERE id = ANY($1::int[]) RETURNING id', [ids]);
  sendSuccess(res, { deletedCount: result.rowCount });
});

/**
 * Массовое обновление кампаний
 * @route POST /api/marketing/bulk-update
 */
const bulkUpdate = asyncHandler(async (req, res) => {
  const { ids, field, value } = req.body;
  if (!ids || ids.length === 0) {
    return sendSuccess(res, []);
  }

  const allowedFields = {
    status: 'status',
    type: 'type',
    budget: 'budget'
  };

  const dbField = allowedFields[field];
  if (!dbField) {
    return sendValidationError(res, 'Invalid field for bulk update');
  }

  const result = await db.query(`UPDATE marketing_campaigns SET ${dbField} = $1 WHERE id = ANY($2::int[]) RETURNING *`, [value, ids]);
  
  const updatedCampaigns = result.rows.map(row => {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      type: row.type,
      budget: parseFloat(row.budget),
      actualCost: parseFloat(row.actual_cost),
      startDate: row.start_date,
      endDate: row.end_date,
      targetAudience: row.target_audience,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  });

  sendSuccess(res, updatedCampaigns);
});

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  bulkDelete,
  bulkUpdate,
};
