/**
 * Contract read helpers
 */

/**
 * Очистка контракта от пустых значений для Sparse Relations UI
 */
const transformContract = (contract) => {
  const transformed = { ...contract };
  const optionalFields = [
    'contractor_id', 'contractor_name', 'project_id', 'project_name', 'type', 'description', 
    'amount', 'payment_status', 'assigned_to', 'assigned_to_name', 'contract_number'
  ];
  
  optionalFields.forEach(field => {
    if (transformed[field] === null || transformed[field] === '' || transformed[field] === undefined) {
      delete transformed[field];
    }
  });
  
  return transformed;
};

async function getAll({ db, options = {} }) {
  const {
    page = 1,
    limit = 20,
    status = null,
    assignedTo = null,
    search = null,
    sortBy = 'created_at',
    sortOrder = 'DESC',
    contractorId = null,
    minAmount = null,
    maxAmount = null,
    dateFrom = null,
    dateTo = null,
    expiresWithinDays = null,
  } = options;

  const offset = (page - 1) * limit;
  let query = `
      SELECT c.*, ctr.name as contractor_name, p.name as project_name, u.name as assigned_to_name,
      COALESCE(array_agg(ct.tag_id) FILTER (WHERE ct.tag_id IS NOT NULL), ARRAY[]::varchar[]) as tags
      FROM contracts c
      LEFT JOIN contractors ctr ON c.contractor_id = ctr.id
      LEFT JOIN projects p ON c.project_id = p.id
      LEFT JOIN users u ON c.assigned_to::varchar = u.id::varchar
      LEFT JOIN contract_tags ct ON c.id = ct.contract_id
      WHERE c.deleted_at IS NULL
    `;
  let countQuery = `
      SELECT COUNT(*) 
      FROM contracts c
      LEFT JOIN contractors ctr ON c.contractor_id = ctr.id
      WHERE c.deleted_at IS NULL
    `;
  const params = [];
  let paramIndex = 1;

  if (status) {
    query += ` AND c.status = $${paramIndex}`;
    countQuery += ` AND c.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  if (assignedTo) {
    query += ` AND c.assigned_to = $${paramIndex}`;
    countQuery += ` AND c.assigned_to = $${paramIndex}`;
    params.push(assignedTo);
    paramIndex++;
  }

  if (contractorId) {
    query += ` AND c.contractor_id = $${paramIndex}`;
    countQuery += ` AND c.contractor_id = $${paramIndex}`;
    params.push(parseInt(contractorId, 10));
    paramIndex++;
  }

  if (minAmount) {
    query += ` AND c.amount >= $${paramIndex}`;
    countQuery += ` AND c.amount >= $${paramIndex}`;
    params.push(parseFloat(minAmount));
    paramIndex++;
  }
  if (maxAmount) {
    query += ` AND c.amount <= $${paramIndex}`;
    countQuery += ` AND c.amount <= $${paramIndex}`;
    params.push(parseFloat(maxAmount));
    paramIndex++;
  }

  if (dateFrom) {
    query += ` AND c.created_at >= $${paramIndex}`;
    countQuery += ` AND c.created_at >= $${paramIndex}`;
    params.push(dateFrom);
    paramIndex++;
  }
  if (dateTo) {
    query += ` AND c.created_at <= $${paramIndex}`;
    countQuery += ` AND c.created_at <= $${paramIndex}`;
    params.push(dateTo);
    paramIndex++;
  }

  if (expiresWithinDays) {
    query += ` AND c.expiration_date <= (CURRENT_DATE + ($${paramIndex} * interval '1 day')) AND c.expiration_date >= CURRENT_DATE`;
    countQuery += ` AND c.expiration_date <= (CURRENT_DATE + ($${paramIndex} * interval '1 day')) AND c.expiration_date >= CURRENT_DATE`;
    params.push(parseInt(expiresWithinDays, 10));
    paramIndex++;
  }

  if (options.projectId) {
    query += ` AND c.project_id = $${paramIndex}`;
    countQuery += ` AND c.project_id = $${paramIndex}`;
    params.push(parseInt(options.projectId, 10));
    paramIndex++;
  }

  if (search) {
    const searchPattern = `%${search}%`;
    query += ` AND (c.name ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex + 1})`;
    countQuery += ` AND (c.name ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex + 1})`;
    params.push(searchPattern, searchPattern);
    paramIndex += 2;
  }

  query += ` GROUP BY c.id, ctr.name, p.name, u.name`;

  const sortColumnMap = {
    name: 'c.name',
    status: 'c.status',
    amount: 'c.amount',
    contractorName: 'ctr.name',
    createdAt: 'c.created_at',
    updatedAt: 'c.updated_at',
    contractNumber: 'c.contract_number',
  };

  const actualSortBy = sortColumnMap[sortBy] || 'c.created_at';

  query += ` ORDER BY ${actualSortBy} ${sortOrder} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const countResult = await db.query(countQuery, params.slice(0, -2));
  const total = parseInt(countResult.rows[0].count, 10);
  const result = await db.query(query, params);

  return {
    contracts: result.rows.map(transformContract),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

async function getById({ db, AppError, contractId }) {
  const result = await db.query(
    `SELECT c.*, ctr.name as contractor_name, p.name as project_name, u.name as assigned_to_name
     FROM contracts c
     LEFT JOIN contractors ctr ON c.contractor_id = ctr.id
     LEFT JOIN projects p ON c.project_id = p.id
     LEFT JOIN users u ON c.assigned_to::varchar = u.id::varchar
     WHERE c.id = $1`,
    [contractId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Contract not found', 404);
  }

  const contract = result.rows[0];

  const versions = await db.query(
    'SELECT id, version_number, name, created_by, created_at FROM contract_versions WHERE contract_id = $1 ORDER BY version_number DESC',
    [contractId]
  );

  const approvals = await db.query(
    'SELECT * FROM contract_approvals WHERE contract_id = $1 ORDER BY step_number ASC',
    [contractId]
  );

  const files = await db.query(
    'SELECT * FROM contract_files WHERE contract_id = $1 ORDER BY created_at DESC',
    [contractId]
  );

  const cases = await db.query(
    'SELECT cc.id, lc.id as case_id, lc.title as name, cc.created_at FROM contract_cases cc JOIN legal_cases lc ON cc.case_id = lc.id WHERE cc.contract_id = $1',
    [contractId]
  );

  const tags = await db.query(
    'SELECT tag_id FROM contract_tags WHERE contract_id = $1',
    [contractId]
  );

  const [invoices, payments, financeSummary] = await Promise.all([
    db.query('SELECT * FROM finance_invoices WHERE contract_id = $1 ORDER BY issue_date DESC', [contractId]),
    db.query('SELECT * FROM finance_payments WHERE contract_id = $1 ORDER BY payment_date DESC', [contractId]),
    db.query(`
      SELECT
        COALESCE(SUM(inv.amount_total), 0) as "totalInvoiced",
        COALESCE(SUM(pay.amount), 0) as "totalPaid"
      FROM contracts c
      LEFT JOIN finance_invoices inv ON c.id = inv.contract_id
      LEFT JOIN finance_payments pay ON c.id = pay.contract_id
      WHERE c.id = $1
    `, [contractId])
  ]);

  return transformContract({
    ...contract,
    versions: versions.rows,
    approvals: approvals.rows,
    files: files.rows,
    cases: cases.rows,
    tags: tags.rows.map((t) => t.tagId),
    invoices: invoices.rows,
    payments: payments.rows,
    financeSummary: financeSummary.rows[0],
  });
}

module.exports = {
  getAll,
  getById,
};