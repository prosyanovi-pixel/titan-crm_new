/**
 * Contract versioning helpers
 */

async function createVersion({ db, logger, contractId, userId, data }) {
  const { name, content, changes, fileId } = data;

  const maxVersion = await db.query(
    'SELECT MAX(version_number) as max_version FROM contract_versions WHERE contract_id = $1',
    [contractId]
  );

  const nextVersion = (maxVersion.rows[0].max_version || 0) + 1;

  const result = await db.query(
    `INSERT INTO contract_versions (contract_id, version_number, name, content, changes, created_by, file_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [contractId, nextVersion, name, content, JSON.stringify(changes || {}), userId, fileId || null]
  );

  logger.info(`contract version created: ${contractId} version ${nextVersion} by user ${userId}`);
  return result.rows[0];
}

async function getVersions({ db, contractId }) {
  const result = await db.query(
    `SELECT cv.*, u.name as created_by_name, cf.original_name as file_name,
       (
         SELECT
           CASE
             WHEN COUNT(*) = 0 THEN 'draft'
             WHEN bool_or(status = 'rejected') THEN 'rejected'
             WHEN bool_or(status = 'pending') THEN 'pending_approval'
             ELSE 'approved'
           END
         FROM contract_approvals ca
         WHERE ca.version_id = cv.id
       ) as status
     FROM contract_versions cv
     LEFT JOIN users u ON cv.created_by = u.id
     LEFT JOIN contract_files cf ON cv.file_id = cf.id
     WHERE cv.contract_id = $1
     ORDER BY cv.version_number DESC`,
    [contractId]
  );

  return result.rows;
}

async function revertToVersion({ db, logger, AppError, contractId, versionId, userId }) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const version = await client.query(
      'SELECT * FROM contract_versions WHERE id = $1 AND contract_id = $2',
      [versionId, contractId]
    );

    if (version.rows.length === 0) {
      throw new AppError('Version not found', 404);
    }

    const maxVersion = await client.query(
      'SELECT MAX(version_number) as max_version FROM contract_versions WHERE contract_id = $1',
      [contractId]
    );

    const nextVersion = (maxVersion.rows[0].max_version || 0) + 1;

    await client.query(
      `INSERT INTO contract_versions (contract_id, version_number, name, content, changes, created_by, file_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        contractId,
        nextVersion,
        `Reverted to version ${version.rows[0].version_number}`,
        version.rows[0].content,
        JSON.stringify({ reverted_from: versionId }),
        userId,
        version.rows[0].file_id
      ]
    );

    await client.query('COMMIT');
    logger.info(`contract reverted to version: ${contractId} to v${version.rows[0].version_number} by user ${userId}`);

    return { success: true, newVersion: nextVersion };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function deleteVersion({ db, logger, AppError, contractId, versionId, userId }) {
  const result = await db.query(
    'DELETE FROM contract_versions WHERE id = $1 AND contract_id = $2 RETURNING *',
    [versionId, contractId]
  );
  
  if (result.rowCount === 0) {
    throw new AppError('Version not found or does not belong to this contract', 404);
  }
  
  logger.info(`Contract version deleted: contract ${contractId}, version ${versionId} by user ${userId}`);
  return { success: true };
}

module.exports = {
  createVersion,
  getVersions,
  revertToVersion,
  deleteVersion,
};