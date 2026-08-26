/**
 * Contract template helpers
 */

async function getTemplates({ db, options = {} }) {
  const {
    page = 1,
    limit = 20,
    category = null,
    isActive = true,
    search = null,
  } = options;

  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM contract_templates WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (isActive !== null) {
    query += ` AND is_active = $${paramIndex}`;
    params.push(isActive);
    paramIndex++;
  }

  if (category) {
    query += ` AND category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }

  if (search) {
    const searchPattern = `%${search}%`;
    query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex + 1})`;
    params.push(searchPattern, searchPattern);
    paramIndex += 2;
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await db.query(query, params);
  return {
    templates: result.rows,
    pagination: { page, limit, total: result.rows.length },
  };
}

async function createTemplate({ db, logger, AppError, userId, data }) {
  const { name, description, content, category } = data;

  if (!name || !content) {
    throw new AppError('Template name and content are required', 400);
  }

  const result = await db.query(
    `INSERT INTO contract_templates (name, description, content, category, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, description || null, content, category || null, userId]
  );

  logger.info(`contract template created: ${result.rows[0].id} by user ${userId}`);
  return result.rows[0];
}

async function updateTemplate({ db, logger, AppError, templateId, userId, data }) {
  const { name, description, content, category, isActive } = data;

  const template = await db.query(
    'SELECT * FROM contract_templates WHERE id = $1',
    [templateId]
  );

  if (template.rows.length === 0) {
    throw new AppError('Template not found', 404);
  }

  const result = await db.query(
    `UPDATE contract_templates
     SET name = COALESCE($1, name),
         description = COALESCE($2, description),
         content = COALESCE($3, content),
         category = COALESCE($4, category),
         is_active = COALESCE($5, is_active),
         updated_by = $6,
         updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [name || null, description || null, content || null, category || null, isActive !== undefined ? isActive : null, userId, templateId]
  );

  logger.info(`contract template updated: ${templateId} by user ${userId}`);
  return result.rows[0];
}

async function deleteTemplate({ db, logger, AppError, templateId }) {
  const template = await db.query(
    'SELECT * FROM contract_templates WHERE id = $1',
    [templateId]
  );

  if (template.rows.length === 0) {
    throw new AppError('Template not found', 404);
  }

  await db.query(
    'DELETE FROM contract_templates WHERE id = $1',
    [templateId]
  );

  logger.info(`contract template deleted: ${templateId}`);
  return { success: true };
}

module.exports = {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
