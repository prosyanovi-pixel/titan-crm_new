/**
 * Contract file management helpers
 */

const fs = require('fs');

async function uploadFiles({ db, logger, AppError, contractId, files, userId }) {
  if (!files || files.length === 0) {
    throw new AppError('No files provided', 400);
  }

  const uploadedFiles = [];

  try {
    for (const file of files) {
      const result = await db.query(
        `INSERT INTO contract_files
         (contract_id, original_name, stored_filename, file_path, mime_type, file_size, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [contractId, file.originalname, file.filename, file.path, file.mimetype, file.size, userId]
      );
      uploadedFiles.push(result.rows[0]);
    }

    logger.info(`files uploaded to contract: ${contractId} (${uploadedFiles.length} files) by user ${userId}`);
    return uploadedFiles;
  } catch (error) {
    // Cleanup files on error
    files.forEach(file => {
      fs.unlink(file.path, err => {
        if (err) logger.error(`Failed to delete file ${file.path}`, err);
      });
    });
    throw error;
  }
}

async function getFiles({ db, contractId }) {
  const result = await db.query(
    'SELECT * FROM contract_files WHERE contract_id = $1 ORDER BY created_at DESC',
    [contractId]
  );
  return result.rows;
}

async function deleteFile({ db, logger, AppError, contractId, fileId }) {
  const file = await db.query(
    'SELECT * FROM contract_files WHERE id = $1 AND contract_id = $2',
    [fileId, contractId]
  );

  if (file.rows.length === 0) {
    throw new AppError('File not found', 404);
  }

  // Use filePath (camelCase from db.js)
  const filePath = file.rows[0].filePath;

  if (filePath) {
    fs.unlink(filePath, err => {
      if (err) logger.warn(`Failed to delete physical file ${filePath}`, err);
    });
  }

  await db.query('DELETE FROM contract_files WHERE id = $1', [fileId]);

  logger.info(`contract file deleted: ${fileId}`);
  return { success: true };
}

module.exports = {
  uploadFiles,
  getFiles,
  deleteFile,
};
