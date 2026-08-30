const db = require('../../db');
const registry = require('./engine/workflowRegistry');
const scheduler = require('./triggers/scheduler');
const eventTrigger = require('./triggers/eventTrigger');
const runner = require('./engine/workflowRunner'); // to run webhooks
const logger = require('../../utils/logger');

const normalizeJsonValue = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
};

const normalizeStep = (step) => {
  const actionConfig = step.action_config ?? step.actionConfig ?? {};
  const stepOrder = step.step_order ?? step.stepOrder ?? null;
  return {
    ...step,
    step_order: stepOrder,
    action_config: normalizeJsonValue(actionConfig, {}),
    condition: normalizeJsonValue(step.condition, null),
  };
};

const parseMaybeJson = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const buildExecutionSummary = (logRows) => {
  const caseMap = new Map();
  const documentMap = new Map();

  const summary = {
    totalSteps: logRows.length,
    successCount: 0,
    errorCount: 0,
    skippedCount: 0,
    updatedCases: [],
    documents: [],
    processing: null,
  };

  for (const log of logRows) {
    if (log.status === 'success') summary.successCount += 1;
    else if (log.status === 'error') summary.errorCount += 1;
    else summary.skippedCount += 1;

    const outputData = parseMaybeJson(log.output_data ?? log.outputData);
    if (!outputData || typeof outputData !== 'object') continue;

    if (log.module === 'mail' && log.action === 'log_processing_status') {
      summary.processing = {
        status: outputData.status || '—',
        progress: Number(outputData.progress) || 0,
        needsRetry: !!outputData.needs_retry,
        summary: outputData.summary || '',
      };
    }

    if (log.module === 'mail' && log.action === 'download_url_to_document') {
      const documentKey = outputData.documentId || outputData.documentName || String(log.step_order ?? log.stepOrder ?? log.id);
      documentMap.set(documentKey, {
        documentId: outputData.documentId || null,
        documentName: outputData.documentName || null,
        url: outputData.url || null,
        success: outputData.success !== false,
        external: !!(outputData.url && /^https?:\/\//i.test(outputData.url)),
      });
    }

    const caseId = outputData.caseId || outputData.case_id || outputData.legalCase?.id || null;
    if (!caseId) continue;

    const currentCase = caseMap.get(caseId) || {
      caseId,
      caseNumber: null,
      title: null,
      status: null,
      instanceId: null,
      instanceNumber: null,
      instanceType: null,
      actions: [],
      notes: [],
      documents: [],
    };

    if (outputData.caseNumber || outputData.case_number || outputData.legalCase?.case_number) {
      currentCase.caseNumber = outputData.caseNumber || outputData.case_number || outputData.legalCase?.case_number;
    }
    if (outputData.title || outputData.legalCase?.title) {
      currentCase.title = outputData.title || outputData.legalCase?.title;
    }
    if (outputData.status || outputData.legalCase?.status) {
      currentCase.status = outputData.status || outputData.legalCase?.status;
    }
    if (outputData.instanceId) currentCase.instanceId = outputData.instanceId;
    if (outputData.instanceNumber) currentCase.instanceNumber = outputData.instanceNumber;
    if (outputData.instanceType) currentCase.instanceType = outputData.instanceType;

    if (log.module === 'legal_cases' && log.action === 'update_case_status') {
      currentCase.actions.push('Статус обновлён');
      currentCase.status = outputData.status || outputData.legalCase?.status || currentCase.status;
    } else if (log.module === 'legal_cases' && log.action === 'add_case_note') {
      currentCase.actions.push('Добавлена заметка');
      const noteText = outputData.note?.text || outputData.note?.description || outputData.note || null;
      if (noteText) currentCase.notes.push(noteText);
    } else if (log.module === 'legal_cases' && log.action === 'attach_document_to_case') {
      currentCase.actions.push('Прикреплён документ');
      if (outputData.documentName) currentCase.documents.push(outputData.documentName);
      else if (outputData.documentId) currentCase.documents.push(outputData.documentId);
    } else if (log.module === 'legal_cases' && log.action === 'ensure_case_instance') {
      currentCase.actions.push('Инстанция подтверждена');
    } else if (log.module === 'legal_cases' && log.action === 'create_legal_case') {
      currentCase.actions.push('Дело создано');
    }

    caseMap.set(caseId, currentCase);
  }

  summary.updatedCases = Array.from(caseMap.values()).map((item) => ({
    ...item,
    actions: Array.from(new Set(item.actions)),
    notes: Array.from(new Set(item.notes)),
    documents: Array.from(new Set(item.documents)),
  }));
  summary.documents = Array.from(documentMap.values());

  return summary;
};

class WorkflowController {
  
  // GET /api/workflows
  async getWorkflows(req, res, next) {
    try {
      const { rows } = await db.query(`
        SELECT w.*,
               COALESCE((
                 SELECT json_agg(ws.* ORDER BY ws.step_order)
                 FROM workflow_steps ws
                 WHERE ws.workflow_id = w.id
               ), '[]'::json) AS steps
        FROM workflows w
        ORDER BY w.created_at DESC
      `);
      const normalized = rows.map((wf) => ({
        ...wf,
        trigger_type: wf.trigger_type ?? wf.triggerType,
        trigger_config: normalizeJsonValue(wf.trigger_config ?? wf.triggerConfig, {}),
        steps: (Array.isArray(wf.steps) ? wf.steps : normalizeJsonValue(wf.steps, [])).map(normalizeStep),
      }));
      res.json(normalized);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/workflows/:id
  async getWorkflowById(req, res, next) {
    try {
      const { id } = req.params;
      const { rows: wfRows } = await db.query('SELECT * FROM workflows WHERE id = $1', [id]);
      if (wfRows.length === 0) return res.status(404).json({ error: 'Workflow not found' });

      const { rows: stepsRows } = await db.query('SELECT * FROM workflow_steps WHERE workflow_id = $1 ORDER BY step_order ASC', [id]);
      
      const workflow = wfRows[0];
      workflow.trigger_type = workflow.trigger_type ?? workflow.triggerType;
      workflow.trigger_config = normalizeJsonValue(workflow.trigger_config ?? workflow.triggerConfig, {});
      workflow.steps = stepsRows.map(normalizeStep);
      
      res.json(workflow);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/workflows
  async createWorkflow(req, res, next) {
    try {
      const { name, description, trigger_type, trigger_config, status, steps } = req.body;
      const userId = req.headers['x-user-id'] || null;

      // Start transaction
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');
        
        // 1. Create workflow
        const { rows: wfRows } = await client.query(
          `INSERT INTO workflows (name, description, trigger_type, trigger_config, status, created_by)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [name, description, trigger_type, trigger_config, status || 'draft', userId]
        );
        const newWf = wfRows[0];

        // 2. Insert steps if provided
        if (steps && Array.isArray(steps) && steps.length > 0) {
          for (let i = 0; i < steps.length; i++) {
            const s = steps[i];
            await client.query(
              `INSERT INTO workflow_steps (workflow_id, step_order, module, action, action_config, condition, delay_seconds, on_fail)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                newWf.id,
                i + 1,
                s.module,
                s.action,
                s.action_config || s.actionConfig || {},
                s.condition || null,
                s.delay_seconds || 0,
                s.on_fail || 'stop'
              ]
            );
          }
        }

        await client.query('COMMIT');
        
        // Fetch full workflow to return
        const { rows: finalSteps } = await db.query('SELECT * FROM workflow_steps WHERE workflow_id = $1 ORDER BY step_order ASC', [newWf.id]);
        newWf.steps = finalSteps;

        // Reload triggers
        scheduler.reloadSpecific(newWf.id, newWf.status, newWf.trigger_type, newWf.trigger_config);
        eventTrigger.reloadSpecific(newWf.id, newWf.status, newWf.trigger_type, newWf.trigger_config);

        res.status(201).json(newWf);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/workflows/:id
  async updateWorkflow(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, trigger_type, trigger_config, status, steps } = req.body;

      // Start transaction
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');
        
        // 1. Update workflow
        const { rows: wfRows } = await client.query(
           `UPDATE workflows 
            SET name = COALESCE($1, name),
                description = COALESCE($2, description),
                trigger_type = COALESCE($3, trigger_type),
                trigger_config = COALESCE($4, trigger_config),
                status = COALESCE($5, status),
                updated_at = NOW()
            WHERE id = $6 RETURNING *`,
           [name, description, trigger_type, trigger_config, status, id]
        );

        if (wfRows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Workflow not found' });
        }
        
        const updatedWf = wfRows[0];

        // 2. Replace steps if provided (delete all and re-insert)
        if (steps && Array.isArray(steps)) {
          await client.query('DELETE FROM workflow_steps WHERE workflow_id = $1', [id]);
          
          for (let i = 0; i < steps.length; i++) {
            const s = steps[i];
            await client.query(
              `INSERT INTO workflow_steps (workflow_id, step_order, module, action, action_config, condition, delay_seconds, on_fail)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                id,
                i + 1,
                s.module,
                s.action,
                s.action_config || s.actionConfig || {},
                s.condition || null,
                s.delay_seconds || 0,
                s.on_fail || 'stop'
              ]
            );
          }
        }

        await client.query('COMMIT');
        
        const { rows: finalSteps } = await db.query('SELECT * FROM workflow_steps WHERE workflow_id = $1 ORDER BY step_order ASC', [id]);
        updatedWf.steps = finalSteps;
        
        // Reload triggers
        scheduler.reloadSpecific(updatedWf.id, updatedWf.status, updatedWf.trigger_type, updatedWf.trigger_config);
        eventTrigger.reloadSpecific(updatedWf.id, updatedWf.status, updatedWf.trigger_type, updatedWf.trigger_config);

        res.json(updatedWf);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/workflows/:id
  async deleteWorkflow(req, res, next) {
    try {
      const { id } = req.params;
      const { rowCount } = await db.query('DELETE FROM workflows WHERE id = $1', [id]);
      if (rowCount === 0) return res.status(404).json({ error: 'Workflow not found' });
      
      // Stop triggers if active
      scheduler.unscheduleWorkflow(id);
      eventTrigger.unsubscribeWorkflow(id);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/workflows/registry/actions
  async getRegistryActions(req, res, next) {
    try {
      // Return structured registry actions for the frontend
      const actions = registry.getAllActions();
      res.json(actions);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/workflows/:id/webhook
  async webhookTrigger(req, res, next) {
    try {
      const { id } = req.params;
      const payload = req.body;
      
      const { rows } = await db.query('SELECT status, trigger_type FROM workflows WHERE id = $1', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Workflow not found' });
      
      const wf = rows[0];
      if (wf.status !== 'active') return res.status(400).json({ error: 'Workflow is not active' });
      // db.query отдаёт ключи в camelCase (toCamelCase в db.js), читаем оба варианта
      if ((wf.trigger_type ?? wf.triggerType) !== 'webhook') return res.status(400).json({ error: 'Workflow does not accept webhooks' });

      // Run execution asynchronously without waiting for it to finish
      const workflowRunner = new runner();
      workflowRunner.start(id, { trigger: 'webhook', body: payload }).catch(err => {
        logger.error(`[Webhook] Async workflow execution failed for ${id}:`, err);
      });

      res.status(202).json({ message: 'Webhook received! Execution started.' });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/workflows/:id/run (Manual trigger)
  async runWorkflow(req, res, next) {
    try {
      const { id } = req.params;
      const { dryRun } = req.body;
      
      const { rows } = await db.query('SELECT name FROM workflows WHERE id = $1', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Workflow not found' });

      const workflowRunner = new runner();
      workflowRunner.start(id, { trigger: 'manual', user: req.headers['x-user-id'] }, !!dryRun).catch(err => {
        logger.error(`[ManualRun] Async workflow execution failed for ${id}:`, err);
      });

      res.json({ message: dryRun ? 'Dry run started' : 'Workflow execution started manually' });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/workflows/:id/validate
  async validateWorkflow(req, res, next) {
    try {
      const { id } = req.params;
      const workflowRunner = new runner();
      const result = await workflowRunner.validateWorkflow(id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/workflows/:id/history
  async getExecutionHistory(req, res, next) {
    try {
      const { id } = req.params;
      const { rows } = await db.query(
        `SELECT * FROM workflow_executions 
         WHERE workflow_id = $1 
         ORDER BY started_at DESC LIMIT 50`,
        [id]
      );
      res.json(rows);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/workflows/:id/history/:execId
  async getExecutionDetails(req, res, next) {
    try {
      const { execId } = req.params;
      const { rows: execRows } = await db.query('SELECT * FROM workflow_executions WHERE id = $1', [execId]);
      if (execRows.length === 0) return res.status(404).json({ error: 'Execution not found' });

      const { rows: logRows } = await db.query(
        `SELECT l.*, s.module, s.action, s.step_order
         FROM workflow_execution_logs l
         LEFT JOIN workflow_steps s ON l.step_id = s.id
         WHERE l.execution_id = $1
         ORDER BY l.executed_at ASC`,
        [execId]
      );

      const exec = execRows[0];
      const summary = buildExecutionSummary(logRows);
      res.json({
        ...exec,
        context: normalizeJsonValue(exec.context, {}),
        executionLogs: normalizeJsonValue(exec.execution_logs ?? exec.executionLogs, []),
        triggerEventPayload: normalizeJsonValue(exec.trigger_event_payload ?? exec.triggerEventPayload, {}),
        summary,
        logs: logRows
      });

    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/workflows/:id/history
  async clearExecutionHistory(req, res, next) {
    try {
      const { id } = req.params;
      await db.query('DELETE FROM workflow_execution_logs WHERE execution_id IN (SELECT id FROM workflow_executions WHERE workflow_id = $1)', [id]);
      await db.query('DELETE FROM workflow_executions WHERE workflow_id = $1', [id]);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/workflows/:id/history/:execId
  async deleteExecution(req, res, next) {
    try {
      const { execId } = req.params;
      await db.query('DELETE FROM workflow_execution_logs WHERE execution_id = $1', [execId]);
      const { rowCount } = await db.query('DELETE FROM workflow_executions WHERE id = $1', [execId]);
      if (rowCount === 0) return res.status(404).json({ error: 'Execution not found' });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/workflows/:id/history/:execId/retry
  async retryExecution(req, res, next) {
    try {
      const { execId } = req.params;
      const workflowRunner = new runner();
      workflowRunner.resume(execId).catch(err => {
        logger.error(`[Retry] Async workflow resume failed for ${execId}:`, err);
      });
      res.json({ message: 'Workflow execution retry started' });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/workflows/:id/history/:execId/approve
  async approveExecution(req, res, next) {
    try {
      const { execId } = req.params;
      const { approved, comment } = req.body;
      const userId = req.headers['x-user-id'];

      // Fetch the execution to update its context
      const { rows } = await db.query('SELECT context, current_step_index, status FROM workflow_executions WHERE id = $1', [execId]);
      if (rows.length === 0) return res.status(404).json({ error: 'Execution not found' });
      const exec = rows[0];

      if (exec.status !== 'waiting_approval') {
        return res.status(400).json({ error: 'Execution is not waiting for approval' });
      }

      let context = typeof exec.context === 'string' ? JSON.parse(exec.context) : exec.context;
      
      // Inject the approval result into the context of the step that paused it
      // The step that paused it is current_step_index - 1
      const stepOrder = exec.current_step_index; 
      context[`step${stepOrder}`] = {
        approved: !!approved,
        comment: comment || '',
        approver_id: userId
      };

      // Update the DB immediately so context is saved even if resume fails
      await db.query('UPDATE workflow_executions SET context = $1 WHERE id = $2', [JSON.stringify(context), execId]);

      const workflowRunner = new runner();
      workflowRunner.resume(execId).catch(err => {
        logger.error(`[Approve] Async workflow resume failed for ${execId}:`, err);
      });

      res.json({ message: 'Workflow execution approval submitted and resumed' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WorkflowController();
