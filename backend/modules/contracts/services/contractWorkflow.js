/**
 * Contract workflow helpers
 */

async function sendForApproval({ contractId, userId, approvers, deadlineDate, versionId: requestedVersionId, db, logger, websocketServer, logAudit, AppError }) {
  const contract = await db.query(
    'SELECT * FROM contracts WHERE id = $1',
    [contractId]
  );

  if (contract.rows.length === 0) {
    throw new AppError('Contract not found', 404);
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    let versionId = requestedVersionId;
    if (!versionId) {
      const maxVersion = await client.query(
        'SELECT id FROM contract_versions WHERE contract_id = $1 ORDER BY version_number DESC LIMIT 1',
        [contractId]
      );
      versionId = maxVersion.rows.length > 0 ? maxVersion.rows[0].id : null;
    }

    const maxStepResult = await client.query(
      'SELECT MAX(step_number) as max_step FROM contract_approvals WHERE contract_id = $1',
      [contractId]
    );
    const maxStep = maxStepResult.rows[0].max_step || 0;

    for (let i = 0; i < approvers.length; i++) {
      await client.query(
        `INSERT INTO contract_approvals (contract_id, step_number, status, assigned_to, version_id, deadline_date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [contractId, maxStep + i + 1, 'pending', approvers[i], versionId, deadlineDate || null]
      );
    }


    await client.query(
      'UPDATE contracts SET status = $1, updated_by = $2, updated_at = NOW() WHERE id = $3',
      ['pending_approval', userId, contractId]
    );

    await client.query('COMMIT');
    logger.info(`contract sent for approval: ${contractId} by user ${userId}`);
    await logAudit(contractId, userId, 'sent_for_approval', { approvers });

    try {
      const contractData = contract.rows[0];
      const title = `Контракт ${contractData.contract_number || contractData.name || contractId}`;
      const message = `Контракт "${contractData.name || contractData.contract_number || contractId}" ожидает вашего одобрения.`;

      for (const approverId of approvers) {
        try {
          await db.query(
            'INSERT INTO notifications (user_id, type, title, message, link) VALUES ($1, $2, $3, $4, $5)',
            [approverId, 'info', title, message, `/contracts/${contractId}`]
          );
        } catch (e) {
          logger.warn(`Failed to create DB notification for user ${approverId}: ${e.message}`);
        }

        try {
          websocketServer.sendToUser(approverId, {
            type: 'contract_approval_requested',
            data: {
              contractId,
              title,
              message,
              link: `/contracts/${contractId}`,
              timestamp: new Date().toISOString(),
            },
          });
        } catch (e) {
          logger.warn(`Failed to send WebSocket notification to user ${approverId}: ${e.message}`);
        }
      }
    } catch (e) {
      logger.warn(`Error while sending approval notifications for contract ${contractId}: ${e.message}`);
    }

    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function approve({ contractId, stepNumber, userId, db, logger, websocketServer, AppError }) {
  const approval = await db.query(
    'SELECT * FROM contract_approvals WHERE contract_id = $1 AND step_number = $2',
    [contractId, stepNumber]
  );

  if (approval.rows.length === 0) {
    throw new AppError('Approval step not found', 404);
  }

  const result = await db.query(
    `UPDATE contract_approvals
     SET status = $1, approved_by = $2, approval_date = NOW(), updated_at = NOW()
     WHERE contract_id = $3 AND step_number = $4
     RETURNING *`,
    ['approved', userId, contractId, stepNumber]
  );

  const allApprovals = await db.query(
    'SELECT COUNT(*) FROM contract_approvals WHERE contract_id = $1 AND status != $2',
    [contractId, 'approved']
  );

  if (parseInt(allApprovals.rows[0].count, 10) === 0) {
    await db.query(
      'UPDATE contracts SET status = $1, updated_at = NOW() WHERE id = $2',
      ['approved', contractId]
    );
  }

  logger.info(`contract approved at step ${stepNumber}: ${contractId} by user ${userId}`);

  try {
    const contractRes = await db.query('SELECT * FROM contracts WHERE id = $1', [contractId]);
    const contractData = contractRes.rows[0];
    const title = `Контракт ${contractData.contract_number || contractData.name || contractId} — одобрен`;
    const message = `Шаг ${stepNumber} по контракту "${contractData.name || contractData.contract_number || contractId}" был одобрен.`;

    const recipients = new Set();
    if (contractData.created_by) recipients.add(contractData.created_by);
    if (contractData.assigned_to) recipients.add(contractData.assigned_to);
    if (userId) recipients.add(userId);

    for (const recipient of recipients) {
      try {
        await db.query(
          'INSERT INTO notifications (user_id, type, title, message, link) VALUES ($1, $2, $3, $4, $5)',
          [recipient, 'info', title, message, `/contracts/${contractId}`]
        );
      } catch (e) {
        logger.warn(`Failed to create DB notification for user ${recipient}: ${e.message}`);
      }

      try {
        websocketServer.sendToUser(recipient, {
          type: 'contract_approved',
          data: { contractId, stepNumber, message, link: `/contracts/${contractId}`, timestamp: new Date().toISOString() },
        });
      } catch (e) {
        logger.warn(`Failed to send WebSocket notification to user ${recipient}: ${e.message}`);
      }
    }
  } catch (e) {
    logger.warn(`Failed to send approve notifications for contract ${contractId}: ${e.message}`);
  }

  return result.rows[0];
}

async function reject({ contractId, stepNumber, userId, reason, db, logger, websocketServer, AppError }) {
  const result = await db.query(
    `UPDATE contract_approvals
     SET status = $1, approved_by = $2, rejection_reason = $3, approval_date = NOW(), updated_at = NOW()
     WHERE contract_id = $4 AND step_number = $5
     RETURNING *`,
    ['rejected', userId, reason, contractId, stepNumber]
  );

  if (result.rows.length === 0) {
    throw new AppError('Approval step not found', 404);
  }

  await db.query(
    'UPDATE contracts SET status = $1, updated_at = NOW() WHERE id = $2',
    ['rejected', contractId]
  );

  logger.info(`contract rejected at step ${stepNumber}: ${contractId} by user ${userId}`);

  try {
    const contractRes = await db.query('SELECT * FROM contracts WHERE id = $1', [contractId]);
    const contractData = contractRes.rows[0];
    const title = `Контракт ${contractData.contract_number || contractData.name || contractId} — отклонён`;
    const message = `Шаг ${stepNumber} по контракту "${contractData.name || contractData.contract_number || contractId}" был отклонён.${reason ? ` Причина: ${reason}` : ''}`;

    const recipients = new Set();
    if (contractData.created_by) recipients.add(contractData.created_by);
    if (contractData.assigned_to) recipients.add(contractData.assigned_to);
    if (userId) recipients.add(userId);

    for (const recipient of recipients) {
      try {
        await db.query(
          'INSERT INTO notifications (user_id, type, title, message, link) VALUES ($1, $2, $3, $4, $5)',
          [recipient, 'warning', title, message, `/contracts/${contractId}`]
        );
      } catch (e) {
        logger.warn(`Failed to create DB notification for user ${recipient}: ${e.message}`);
      }

      try {
        websocketServer.sendToUser(recipient, {
          type: 'contract_rejected',
          data: { contractId, stepNumber, message, link: `/contracts/${contractId}`, timestamp: new Date().toISOString() },
        });
      } catch (e) {
        logger.warn(`Failed to send WebSocket notification to user ${recipient}: ${e.message}`);
      }
    }
  } catch (e) {
    logger.warn(`Failed to send reject notifications for contract ${contractId}: ${e.message}`);
  }

  return result.rows[0];
}

async function getApprovalHistory({ contractId, db }) {
  const result = await db.query(
    `SELECT ca.*, u.name as approver_name, u2.name as assigned_to_name, cv.version_number
     FROM contract_approvals ca
     LEFT JOIN users u ON ca.approved_by = u.id
     LEFT JOIN users u2 ON ca.assigned_to = u2.id
     LEFT JOIN contract_versions cv ON ca.version_id = cv.id
     WHERE ca.contract_id = $1
     ORDER BY ca.step_number ASC`,
    [contractId]
  );

  return result.rows;
}

async function cancelApproval({ contractId, userId, db, logger, websocketServer, logAudit, AppError }) {
  const contract = await db.query('SELECT * FROM contracts WHERE id = $1', [contractId]);
  if (contract.rows.length === 0) {
    throw new AppError('Contract not found', 404);
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const pendingApprovals = await client.query(
      'SELECT * FROM contract_approvals WHERE contract_id = $1 AND status = $2',
      [contractId, 'pending']
    );

    await client.query(
      'UPDATE contract_approvals SET status = $1, updated_at = NOW() WHERE contract_id = $2 AND status = $3',
      ['cancelled', contractId, 'pending']
    );

    await client.query(
      'UPDATE contracts SET status = $1, updated_by = $2, updated_at = NOW() WHERE id = $3',
      ['draft', userId, contractId]
    );

    await client.query('COMMIT');
    logger.info(`contract approval cancelled: ${contractId} by user ${userId}`);
    await logAudit(contractId, userId, 'approval_cancelled', {});

    try {
      const contractData = contract.rows[0];
      const title = `Согласование отменено`;
      const message = `Процесс согласования контракта "${contractData.name || contractData.contract_number || contractId}" был отменен инициатором.`;

      for (const approval of pendingApprovals.rows) {
        if (approval.assigned_to) {
          try {
            await db.query(
              'INSERT INTO notifications (user_id, type, title, message, link) VALUES ($1, $2, $3, $4, $5)',
              [approval.assigned_to, 'info', title, message, `/contracts/${contractId}`]
            );
          } catch (e) {
            logger.warn(`Failed to create DB notification for user ${approval.assigned_to}: ${e.message}`);
          }

          try {
            websocketServer.sendToUser(approval.assigned_to, {
              type: 'contract_approval_cancelled',
              data: {
                contractId,
                title,
                message,
                link: `/contracts/${contractId}`,
                timestamp: new Date().toISOString(),
              },
            });
          } catch (e) {
            logger.warn(`Failed to send WebSocket notification to user ${approval.assigned_to}: ${e.message}`);
          }
        }
      }
    } catch (e) {
      logger.warn(`Error while sending approval cancellation notifications for contract ${contractId}: ${e.message}`);
    }

    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  sendForApproval,
  approve,
  reject,
  getApprovalHistory,
  cancelApproval,
};
