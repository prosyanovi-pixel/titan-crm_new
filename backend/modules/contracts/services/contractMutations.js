/**
 * Contract deletion, bulk update, and dashboard metrics helpers
 */

async function deleteContract({ db, logger, AppError, contractId, userId, logAudit }) {
  const contract = await db.query('SELECT * FROM contracts WHERE id = $1', [contractId]);

  if (contract.rows.length === 0) {
    throw new AppError('Contract not found', 404);
  }

  const deletedContractData = contract.rows[0];

  await db.query('UPDATE contracts SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [contractId]);

  logger.info(`contract deleted: ${contractId}`);

  if (userId) {
    await logAudit(contractId, userId, 'contract_deleted', { deleted_contract: deletedContractData });
  }

  return { success: true };
}

async function bulkDelete({ db, logger, AppError, contractIds, userId, logAudit }) {
  if (!contractIds || contractIds.length === 0) {
    throw new AppError('No contract IDs provided for bulk deletion', 400);
  }

  const result = await db.query(
    'UPDATE contracts SET deleted_at = CURRENT_TIMESTAMP WHERE id = ANY($1::uuid[]) RETURNING id',
    [contractIds]
  );

  if (result.rows.length === 0) {
    throw new AppError('No contracts found for deletion', 404);
  }

  logger.info(`bulk deleted contracts: ${result.rows.map((row) => row.id).join(', ')}`);

  if (userId) {
    for (const row of result.rows) {
      await logAudit(row.id, userId, 'contract_deleted_bulk', {});
    }
  }

  return { success: true };
}

async function bulkUpdateStatus({ db, logger, AppError, userId, contractIds, newStatus, logAudit }) {
  if (!contractIds || contractIds.length === 0) {
    throw new AppError('No contract IDs provided for bulk status update', 400);
  }
  if (!newStatus) {
    throw new AppError('New status is required for bulk update', 400);
  }

  const result = await db.query(
    `UPDATE contracts
     SET status = $1, updated_by = $2, updated_at = NOW()
     WHERE id = ANY($3::uuid[])
     RETURNING id`,
    [newStatus, userId, contractIds]
  );

  if (result.rows.length === 0) {
    throw new AppError('No contracts found for status update', 404);
  }

  logger.info(`bulk updated status to ${newStatus} for contracts: ${result.rows.map((row) => row.id).join(', ')} by user ${userId}`);

  if (userId) {
    for (const row of result.rows) {
      await logAudit(row.id, userId, 'contract_status_updated_bulk', { new_status: newStatus });
    }
  }

  return { success: true };
}

async function getContractMetrics({ db }) {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  const pendingApprovalsResult = await db.query("SELECT COUNT(*) FROM contracts WHERE status = 'pending_approval'");
  const pendingApprovalsCount = parseInt(pendingApprovalsResult.rows[0].count, 10);

  const expiringSoonResult = await db.query(
    'SELECT COUNT(*) FROM contracts WHERE expiration_date IS NOT NULL AND expiration_date <= $1',
    [thirtyDaysFromNow.toISOString().split('T')[0]]
  );
  const expiringSoonCount = parseInt(expiringSoonResult.rows[0].count, 10);

  return { pendingApprovalsCount, expiringSoonCount };
}

module.exports = {
  deleteContract,
  bulkDelete,
  bulkUpdateStatus,
  getContractMetrics,
};