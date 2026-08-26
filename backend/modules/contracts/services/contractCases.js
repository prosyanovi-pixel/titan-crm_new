/**
 * Contract case linking helpers
 */

async function linkCase({ db, logger, AppError, contractId, caseId, userId }) {
  const existing = await db.query(
    'SELECT * FROM contract_cases WHERE contract_id = $1 AND case_id = $2',
    [contractId, caseId]
  );

  if (existing.rows.length > 0) {
    throw new AppError('Contract already linked to this case', 400);
  }

  const result = await db.query(
    `INSERT INTO contract_cases (contract_id, case_id, linked_by)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [contractId, caseId, userId]
  );

  logger.info(`contract linked to case: ${contractId} -> ${caseId} by user ${userId}`);
  return result.rows[0];
}

async function unlinkCase({ db, logger, AppError, contractId, caseId }) {
  const result = await db.query(
    'DELETE FROM contract_cases WHERE contract_id = $1 AND case_id = $2 RETURNING *',
    [contractId, caseId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Contract case link not found', 404);
  }

  logger.info(`contract unlinked from case: ${contractId} -> ${caseId}`);
  return { success: true };
}

async function getContractsForCase({ db, caseId, options = {} }) {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  const result = await db.query(
    `SELECT c.* FROM contracts c
     JOIN contract_cases cc ON c.id = cc.contract_id
     WHERE cc.case_id = $1
     ORDER BY c.created_at DESC
     LIMIT $2 OFFSET $3`,
    [caseId, limit, offset]
  );

  const countResult = await db.query(
    'SELECT COUNT(*) FROM contract_cases WHERE case_id = $1',
    [caseId]
  );

  return {
    contracts: result.rows,
    pagination: {
      page,
      limit,
      total: parseInt(countResult.rows[0].count, 10),
    },
  };
}

module.exports = {
  linkCase,
  unlinkCase,
  getContractsForCase,
};
