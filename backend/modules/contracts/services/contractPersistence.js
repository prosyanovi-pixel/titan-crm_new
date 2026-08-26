/**
 * Contract mutation helpers
 */

async function create({ db, logger, AppError, generateNextNumber, userId, data, logAudit }) {
  const { name, description, assignedTo, templateId, contractorId, type, amount, currency, paymentStatus, expirationDate, endDate, startDate, projectId } = data;

  if (!name) {
    throw new AppError('Contract name is required', 400);
  }

  const contractNumber = data.contractNumber || await generateNextNumber('contracts');
  const finalEndDate = endDate || expirationDate || null;
  const finalStartDate = startDate || null;

  const contractData = {
    name,
    contract_number: contractNumber,
    description: description || null,
    assigned_to: assignedTo || null,
    template_id: templateId || null,
    status: 'draft',
    created_by: userId,
    updated_by: userId,
    contractor_id: contractorId ? parseInt(contractorId, 10) : null,
    type: type || 'service',
    amount: amount !== undefined ? parseFloat(amount) : null,
    currency: currency || 'RUB',
    payment_status: paymentStatus || 'unpaid',
    expiration_date: finalEndDate,
    start_date: finalStartDate,
    project_id: projectId ? parseInt(projectId, 10) : null,
  };

  let templateContent = null;
  if (templateId) {
    const template = await db.query('SELECT * FROM contract_templates WHERE id = $1', [templateId]);

    if (template.rows.length === 0) {
      throw new AppError('Template not found', 404);
    }

    contractData.description = contractData.description || template.rows[0].description;
    templateContent = template.rows[0].content;
  }

  const result = await db.query(
    `INSERT INTO contracts (name, contract_number, description, assigned_to, template_id, status, created_by, updated_by, contractor_id, type, amount, currency, payment_status, expiration_date, start_date, project_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING *`,
    [
      contractData.name,
      contractData.contract_number,
      contractData.description,
      contractData.assigned_to,
      contractData.template_id,
      contractData.status,
      contractData.created_by,
      contractData.updated_by,
      contractData.contractor_id,
      contractData.type,
      contractData.amount,
      contractData.currency,
      contractData.payment_status,
      contractData.expiration_date,
      contractData.start_date,
      contractData.project_id,
    ]
  );

  const contract = result.rows[0];

  if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
    const tagQueries = data.tags.map((tagId) =>
      db.query('INSERT INTO contract_tags (contract_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [contract.id, tagId])
    );
    await Promise.all(tagQueries);
  }

  if (templateId) {
    await db.query(
      `INSERT INTO contract_versions (contract_id, version_number, name, content, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [contract.id, 1, contract.name, templateContent, userId]
    );
  }

  logger.info(`contract created: ${contract.id} by user ${userId}`);
  await logAudit(contract.id, userId, 'contract_created', { new_contract: contract });
  return contract;
}

async function update({ db, AppError, contractId, userId, data, logAudit }) {
  const { name, contractNumber, description, assignedTo, status, templateId, contractorId, type, amount, currency, paymentStatus, expirationDate, endDate, startDate, projectId } = data;

  const contract = await db.query('SELECT * FROM contracts WHERE id = $1', [contractId]);

  if (contract.rows.length === 0) {
    throw new AppError('Contract not found', 404);
  }

  const existingContract = contract.rows[0];
  const finalEndDate = endDate !== undefined ? endDate : (expirationDate !== undefined ? expirationDate : undefined);
  const finalStartDate = startDate !== undefined ? startDate : undefined;

  if (data.tags && Array.isArray(data.tags)) {
    await db.query('DELETE FROM contract_tags WHERE contract_id = $1', [contractId]);
    if (data.tags.length > 0) {
      const tagQueries = data.tags.map((tagId) =>
        db.query('INSERT INTO contract_tags (contract_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [contractId, tagId])
      );
      await Promise.all(tagQueries);
    }
  }

  const fieldMap = {
    name: 'name',
    contractNumber: 'contract_number',
    description: 'description',
    assignedTo: 'assigned_to',
    status: 'status',
    templateId: 'template_id',
    contractorId: 'contractor_id',
    type: 'type',
    amount: 'amount',
    currency: 'currency',
    paymentStatus: 'payment_status',
    projectId: 'project_id'
  };

  const setClauses = [];
  const values = [];
  let idx = 1;

  for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
    if (data[jsKey] !== undefined) {
      setClauses.push(`${dbCol} = $${idx}`);
      let val = data[jsKey];
      if (jsKey === 'contractorId' || jsKey === 'projectId') {
        val = val ? parseInt(val, 10) : null;
      }
      if (jsKey === 'amount') {
        val = val ? parseFloat(val) : null;
      }
      values.push(val);
      idx++;
    }
  }

  // Handle dates separately
  if (finalEndDate !== undefined) {
    setClauses.push(`expiration_date = $${idx++}`);
    values.push(finalEndDate || null);
  }
  if (finalStartDate !== undefined) {
    setClauses.push(`start_date = $${idx++}`);
    values.push(finalStartDate || null);
  }

  if (setClauses.length === 0) {
    return existingContract; // Nothing to update
  }

  setClauses.push(`updated_by = $${idx++}`);
  values.push(userId);
  setClauses.push(`updated_at = NOW()`);

  values.push(contractId);
  const result = await db.query(
    `UPDATE contracts SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  const updatedContract = result.rows[0];
  const changes = {};

  for (const key in data) {
    const dbKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    if (existingContract[dbKey] !== updatedContract[dbKey]) {
      changes[key] = {
        old_value: existingContract[dbKey],
        new_value: updatedContract[dbKey],
      };
    }
  }

  if (data.tags) {
    const oldTags = await db.query('SELECT tag_id FROM contract_tags WHERE contract_id = $1', [contractId]);
    const oldTagIds = new Set(oldTags.rows.map((t) => t.tag_id));
    const newTagIds = new Set(data.tags);

    const addedTags = [...newTagIds].filter((tag) => !oldTagIds.has(tag));
    const removedTags = [...oldTagIds].filter((tag) => !newTagIds.has(tag));

    if (addedTags.length > 0 || removedTags.length > 0) {
      changes.tags = {
        old_value: [...oldTagIds],
        new_value: [...newTagIds],
        added: addedTags,
        removed: removedTags,
      };
    }
  }

  if (Object.keys(changes).length > 0) {
    await logAudit(contractId, userId, 'contract_updated', { changes });
  }

  return updatedContract;
}

module.exports = {
  create,
  update,
};