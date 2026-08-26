/**
 * Helper для окончательного удаления документов и файлов из хранилища
 */

const path = require('path');
const db = require('../../../db');
const storageService = require('../services/storageService');

async function removeDocumentsPermanentlyByIds(ids) {
  const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ');
  const { rows: rowsToDelete } = await db.query(
    `WITH RECURSIVE descendants AS (
       SELECT id FROM documents WHERE id IN (${placeholders})
       UNION
       SELECT d.id
       FROM documents d
       INNER JOIN descendants parent_docs ON d.parent_id = parent_docs.id
     )
     SELECT id, type, stored_filename, name
     FROM documents
     WHERE id IN (SELECT id FROM descendants)`,
    ids
  );

  if (rowsToDelete.length === 0) {
    return 0;
  }

  await db.query(
    `WITH RECURSIVE descendants AS (
       SELECT id FROM documents WHERE id IN (${placeholders})
       UNION
       SELECT d.id
       FROM documents d
       INNER JOIN descendants parent_docs ON d.parent_id = parent_docs.id
     )
     DELETE FROM documents
     WHERE id IN (SELECT id FROM descendants)`,
    ids
  );

  for (const file of rowsToDelete) {
    if (file.type !== 'file') continue;

    const storedFilename = file.stored_filename || file.storedFilename || (file.id + path.extname(file.name));
    await storageService.deleteFile(storedFilename);
  }

  return rowsToDelete.length;
}

module.exports = {
  removeDocumentsPermanentlyByIds,
};
