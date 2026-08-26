const db = require('../../../db');
const registry = require('./workflowRegistry');
const logger = require('../../../utils/logger');

function safeStringify(obj) {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (value === null || value === undefined) return value;
    if (typeof value === 'function' || typeof value === 'symbol') return undefined;
    if (typeof value === 'object') {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
    }
    return value;
  });
}

class WorkflowRunner {

  /**
   * Starts a new workflow execution
   */
  async start(workflowId, payload = {}, dryRun = false) {
    if (dryRun) logger.info(`[WorkflowRunner] DRY RUN starting for ${workflowId}`);
    logger.info(`[WorkflowRunner] Starting workflow ${workflowId}`);
    
    let executionId;
    let executionLogs = [];
    try {
      await registry.loadActions();
      
      const { rows: wfRows } = await db.query('SELECT * FROM workflows WHERE id = $1', [workflowId]);
      if (wfRows.length === 0) throw new Error(`Workflow ${workflowId} not found`);
      
      if (wfRows[0].status !== 'active' && payload.trigger !== 'manual') {
        logger.info(`[WorkflowRunner] Workflow ${workflowId} is ${wfRows[0].status} and trigger is ${payload.trigger}, skipping.`);
        return null;
      }

      // Create execution record
      const { rows: execRows } = await db.query(
        `INSERT INTO workflow_executions (workflow_id, status, trigger_event_payload, context, current_step_index) 
         VALUES ($1, $2, $3, '{}', 0) RETURNING id`,
        [workflowId, dryRun ? 'dry_run' : 'running', safeStringify(payload)]
      );
      executionId = execRows[0].id;

      let context = { trigger: payload };
      
      return await this._execute(executionId, workflowId, 0, context, dryRun, executionLogs);
    } catch (err) {
      logger.error(`[WorkflowRunner] Fatal error on start:`, err.message);
      if (executionId) {
        await db.query(
          `UPDATE workflow_executions SET status = 'failed', finished_at = NOW(), execution_logs = $1 WHERE id = $2`,
          [safeStringify(executionLogs), executionId]
        );
      }
      throw err;
    }

  }

  /**
   * Resumes a paused, waiting, or failed workflow execution
   */
  async resume(executionId, overrideStepIndex = null) {
    logger.info(`[WorkflowRunner] Resuming execution ${executionId}`);
    let executionLogs = [];
    try {
      await registry.loadActions();

      const { rows: execRows } = await db.query('SELECT * FROM workflow_executions WHERE id = $1', [executionId]);
      if (execRows.length === 0) throw new Error(`Execution ${executionId} not found`);
      const exec = execRows[0];

      // Update to running
      await db.query(
        `UPDATE workflow_executions SET status = 'running', resume_at = NULL WHERE id = $1`,
        [executionId]
      );

      const startIndex = overrideStepIndex !== null ? overrideStepIndex : exec.currentStepIndex;
      const context = typeof exec.context === 'string' ? JSON.parse(exec.context) : (exec.context || {});
      
      // We load existing logs if any
      executionLogs = typeof exec.executionLogs === 'string' ? JSON.parse(exec.executionLogs) : (exec.executionLogs || []);

      return await this._execute(executionId, exec.workflowId, startIndex, context, false, executionLogs);
    } catch (err) {
      logger.error(`[WorkflowRunner] Fatal error on resume:`, err.message);
      await db.query(
        `UPDATE workflow_executions SET status = 'failed', finished_at = NOW(), execution_logs = $1 WHERE id = $2`,
        [safeStringify(executionLogs), executionId]
      );
      throw err;
    }
  }

  /**
   * Internal method to run steps from a given index
   */
  async _execute(executionId, workflowId, startIndex, initialContext, dryRun, executionLogs) {
    const { rows: steps } = await db.query(
      `SELECT * FROM workflow_steps WHERE workflow_id = $1 ORDER BY step_order ASC`,
      [workflowId]
    );

    let context = initialContext;

    const stepLogger = {
      log: (msg) => {
        executionLogs.push({ time: new Date().toISOString(), msg });
        console.log(`[WorkflowRunner][LOG] ${msg}`);
      },
      error: (msg) => {
        executionLogs.push({ time: new Date().toISOString(), msg, level: 'error' });
        console.error(`[WorkflowRunner][ERR] ${msg}`);
      },
      info: (msg) => {
        executionLogs.push({ time: new Date().toISOString(), msg, level: 'info' });
        console.log(`[WorkflowRunner][INF] ${msg}`);
      },
      warn: (msg) => {
        executionLogs.push({ time: new Date().toISOString(), msg, level: 'warn' });
        console.warn(`[WorkflowRunner][WRN] ${msg}`);
      }
    };

    const runStepsFrom = async (idx, localContext) => {
      for (let i = idx; i < steps.length; i++) {
        const step = steps[i];
        const actionHandler = registry.getAction(step.module, step.action);
        const actionLabel = actionHandler?.label || `${step.module}.${step.action}`;
        const stepDisplay = `Step ${step.stepOrder}: ${actionLabel}`;
        console.log(`[WorkflowRunner] ${stepDisplay}`);

        try {
          // CONDITION CHECK
          if (step.condition && Object.keys(step.condition).length > 0) {
            const conditionMet = this.evaluateCondition(step.condition, localContext);
            if (!conditionMet) {
              await db.query(
                `INSERT INTO workflow_execution_logs (execution_id, step_id, status, error_message) VALUES ($1, $2, 'skipped', 'Condition not met')`,
                [executionId, step.id]
              );
              continue; 
            }
          }

          // INTERCEPT DELAY OR HUMAN APPROVAL FOR PAUSE
          // 1. Human Approval Action
          if (step.module === 'core' && step.action === 'human_approval') {
            stepLogger.info(`Pausing for human approval...`);
            await this._pauseExecution(executionId, 'waiting_approval', i + 1, localContext, executionLogs, null);
            return { __PAUSED__: true }; // Stop execution
          }

          // 2. Long Delay (> 60 seconds should be paused rather than setTimeout)
          if (step.delaySeconds && step.delaySeconds > 60) {
            stepLogger.info(`Pausing execution for ${step.delaySeconds} seconds...`);
            const resumeAt = new Date(Date.now() + step.delaySeconds * 1000);
            await this._pauseExecution(executionId, 'paused', i, localContext, executionLogs, resumeAt);
            return { __PAUSED__: true }; // Stop execution
          } else if (step.delaySeconds && step.delaySeconds > 0) {
            console.log(`[WorkflowRunner] Short delay: ${step.delaySeconds}s`);
            await new Promise(r => setTimeout(r, step.delaySeconds * 1000));
          }

          const actionHandler = registry.getAction(step.module, step.action);
          if (!actionHandler) throw new Error(`Action handler not found for ${step.module}.${step.action}`);

          const parsedConfig = step.actionConfig ? this.parseContextVariables(step.actionConfig, localContext) : {};
          let outputData = { skipped: 'Dry Run' };

          if (!dryRun || actionHandler.isReadOnly) {
            stepLogger.info(`Executing ${actionLabel}...`);
            outputData = await actionHandler.handler(parsedConfig, localContext, stepLogger);
          } else {
            stepLogger.info(`Skipping side-effect action (Dry Run)`);
          }

          await db.query(
            `INSERT INTO workflow_execution_logs (execution_id, step_id, status, output_data) VALUES ($1, $2, 'success', $3)`,
            [executionId, step.id, safeStringify(outputData)]
          );

          localContext[`step${step.stepOrder}`] = outputData;

          // Special case for email array processing
          if (step.module === 'mail' && step.action === 'fetch_emails' && parsedConfig.process_each_email && Array.isArray(outputData?.emails)) {
             const emailErrors = [];
             for (const email of outputData.emails) {
               const perEmailContext = { ...localContext, [`step${step.stepOrder}`]: { ...outputData, emails: [email] } };
               try {
                 const res = await runStepsFrom(i + 1, perEmailContext);
                 if (res && res.__PAUSED__) return { __PAUSED__: true };
               } catch (e) {
                 stepLogger.error(`Error processing email: ${e.message}`);
                 emailErrors.push(e);
                 if (step.onFail === 'stop') throw e;
               }
             }
             return localContext; // Inner loop finished remaining steps for all emails (or skipped if empty)
          }

          console.log(`[WorkflowRunner] ${stepDisplay} ✓`);

        } catch (stepError) {
          stepLogger.error(`[WorkflowRunner] Step ${step.stepOrder} ERROR:`, stepError.message);
          await db.query(
            `INSERT INTO workflow_execution_logs (execution_id, step_id, status, error_message) VALUES ($1, $2, 'error', $3)`,
            [executionId, step.id, stepError.message]
          );

          if (step.onFail === 'stop') {
             // Save current context and fail
             await this._pauseExecution(executionId, 'failed', i, localContext, executionLogs, null);
             throw new Error(`Stopped at Step ${step.stepOrder} [${actionLabel}]: ${stepError.message}`);
          }
          localContext[`step${step.stepOrder}`] = { error: stepError.message };
        }
      }
      return localContext;
    };

    const result = await runStepsFrom(startIndex, context);
    if (result && result.__PAUSED__) {
      return { status: 'paused_or_waiting', executionId };
    }

    // Finished
    const contextToSave = {
      trigger: context.trigger,
      ...Object.keys(context).filter(k => k.startsWith('step')).reduce((acc, k) => {
        acc[k] = typeof context[k] === 'object' && context[k] !== null ? { status: 'completed', ...context[k] } : context[k];
        return acc;
      }, {})
    };

    await db.query(
      `UPDATE workflow_executions SET status = 'completed', finished_at = NOW(), context = $1, execution_logs = $2 WHERE id = $3`,
      [safeStringify(contextToSave), safeStringify(executionLogs), executionId]
    );
    console.log(`[WorkflowRunner] Execution ${executionId} ✓ completed`);
    return { status: 'completed', executionId, context, logs: executionLogs };
  }

  async _pauseExecution(executionId, status, stepIndex, context, executionLogs, resumeAt) {
    const contextToSave = {
      trigger: context.trigger,
      ...Object.keys(context).filter(k => k.startsWith('step')).reduce((acc, k) => {
        acc[k] = typeof context[k] === 'object' && context[k] !== null ? { status: 'completed', ...context[k] } : context[k];
        return acc;
      }, {})
    };

    await db.query(
      `UPDATE workflow_executions 
       SET status = $1, current_step_index = $2, context = $3, execution_logs = $4, resume_at = $5
       WHERE id = $6`,
      [status, stepIndex, safeStringify(contextToSave), safeStringify(executionLogs), resumeAt, executionId]
    );
  }

  evaluateCondition(condition, context) {
    if (!condition || !condition.field) return true;
    const { field, operator, value } = condition;
    const actual = this.resolvePath(field, context);

    switch (operator) {
      case 'exists': return actual !== undefined && actual !== null && actual !== '';
      case 'not_exists': return actual === undefined || actual === null || actual === '';
      case 'equals': return String(actual) === String(value);
      case 'not_equals': return String(actual) !== String(value);
      case 'contains': return String(actual).toLowerCase().includes(String(value).toLowerCase());
      case 'not_contains': return !String(actual).toLowerCase().includes(String(value).toLowerCase());
      case 'regex': try { return new RegExp(value, 'i').test(String(actual)); } catch { return false; }
      case 'gt': return parseFloat(actual) > parseFloat(value);
      case 'gte': return parseFloat(actual) >= parseFloat(value);
      case 'lt': return parseFloat(actual) < parseFloat(value);
      case 'lte': return parseFloat(actual) <= parseFloat(value);
      default: return true;
    }
  }

  resolvePath(path, obj) {
    // Normalize path: convert brackets like [0] to .0
    const normalizedPath = path.replace(/\[(\d+)\]/g, '.$1');
    return normalizedPath.split('.').reduce((acc, part) => {
      if (acc === undefined || acc === null) return undefined;
      if (!isNaN(part)) return acc[parseInt(part)];
      if (acc[part] !== undefined) return acc[part];
      const camelPart = part.replace(/([-_][a-z])/ig, ($1) => $1.toUpperCase().replace('-', '').replace('_', ''));
      return acc[camelPart];
    }, obj);
  }

  parseContextVariables(config, context) {
    if (!config) return {};
    const result = JSON.parse(JSON.stringify(config));
    
    const traverse = (node) => {
      if (typeof node === 'string') {
        // If the string is EXACTLY a single variable, preserve its type (e.g., array/object)
        const exactMatch = node.match(/^\{\{([^}]+)\}\}$/);
        if (exactMatch) {
           const val = this.resolvePath(exactMatch[1].trim(), context);
           return val !== undefined && val !== null ? val : '';
        }
        
        // Otherwise do string replacement
        return node.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
          const val = this.resolvePath(path.trim(), context);
          // Return empty string if undefined to avoid showing literal placeholders in DB/UI
          return val !== undefined && val !== null ? (typeof val === 'object' ? JSON.stringify(val) : val) : '';
        });
      } else if (Array.isArray(node)) {
        return node.map(item => traverse(item));
      } else if (typeof node === 'object' && node !== null) {
        for (const key in node) node[key] = traverse(node[key]);
        return node;
      }
      return node;
    };
    return traverse(result);
  }

  async validateWorkflow(workflowId) {
    const { rows: wfRows } = await db.query('SELECT * FROM workflows WHERE id = $1', [workflowId]);
    if (wfRows.length === 0) return { valid: false, errors: ['Workflow not found'] };

    const { rows: steps } = await db.query('SELECT * FROM workflow_steps WHERE workflow_id = $1 ORDER BY step_order ASC', [workflowId]);
    const errors = [];
    const warnings = [];
    if (steps.length === 0) errors.push('Workflow has no steps');

    for (const step of steps) {
      const actionHandler = registry.getAction(step.module, step.action);
      if (!actionHandler) {
        errors.push(`Step ${step.stepOrder}: Action handler not found for "${step.module}.${step.action}"`);
        continue;
      }
      
      const configStr = JSON.stringify(step.action_config || {});
      const placeholders = configStr.match(/\{\{([^}]+)\}\}/g) || [];
      placeholders.forEach(p => {
        const path = p.replace(/[{}]/g, '').trim();
        if (path.startsWith('step')) {
          const match = path.match(/^step(\d+)\.(.+)$/);
          if (match) {
            const stepNum = parseInt(match[1]);
            const propertyPath = match[2];
            const targetStep = steps.find(s => s.step_order === stepNum);
            
            if (stepNum >= step.stepOrder) {
              errors.push(`Step ${step.stepOrder}: Refers to future step "${path}"`);
            } else if (!targetStep) {
              errors.push(`Step ${step.stepOrder}: Refers to non-existent step "${stepNum}"`);
            } else {
              const targetHandler = registry.getAction(targetStep.module, targetStep.action);
              if (targetHandler && targetHandler.outputSchema && targetHandler.outputSchema.properties) {
                const parts = propertyPath.split('.');
                let currentSchema = targetHandler.outputSchema;
                let found = true;

                for (const part of parts) {
                  // Handle array access like .0. or [0]
                  if (/^\d+$/.test(part) || (part.startsWith('[') && part.endsWith(']'))) {
                    if (currentSchema.type === 'array') {
                       currentSchema = currentSchema.items || {};
                       warnings.push(`Step ${step.stepOrder}: Uses index access on Step ${stepNum} array. This may fail if the array is empty.`);
                    } else {
                       found = false;
                       break;
                    }
                    continue;
                  }

                  if (currentSchema.properties && currentSchema.properties[part]) {
                    currentSchema = currentSchema.properties[part];
                  } else {
                    found = false;
                    break;
                  }
                }

                if (!found) {
                  errors.push(`Step ${step.stepOrder}: Property "${propertyPath}" not found in Step ${stepNum} output schema`);
                }
              }
            }
          } else {
            const stepNumOnly = parseInt(path.replace('step', ''));
            if (isNaN(stepNumOnly) || stepNumOnly >= step.stepOrder) {
               errors.push(`Step ${step.stepOrder}: Invalid variable reference "${path}"`);
            }
          }
        }
      });
    }

    return { valid: errors.length === 0, errors, warnings };

  }
}

module.exports = WorkflowRunner;
