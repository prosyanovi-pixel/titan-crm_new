const cron = require('node-cron');
const db = require('../../../db');
const WorkflowRunner = require('../engine/workflowRunner');
const logger = require('../../../utils/logger');

class WorkflowScheduler {
  constructor() {
    this.scheduledTasks = new Map(); // Store active cron tasks by workflowId
  }

  async initialize() {
    console.log('[WorkflowScheduler] Initializing scheduled workflows...');
    try {
      const result = await db.query(
        "SELECT id, trigger_config FROM workflows WHERE status = 'active' AND trigger_type = 'schedule'"
      );
      
      const workflows = result.rows;
      if (workflows.length === 0) {
        console.log('[WorkflowScheduler] No active scheduled workflows found.');
        return;
      }

      let scheduled = 0;
      for (const wf of workflows) {
        // db.query возвращает ключи в camelCase (toCamelCase в db.js), поэтому читаем оба варианта
        if (this.scheduleWorkflow(wf.id, wf.trigger_config ?? wf.triggerConfig)) {
          scheduled++;
        }
      }
      
      console.log(`[WorkflowScheduler] Successfully scheduled ${scheduled}/${workflows.length} workflows.`);
    } catch (err) {
      logger.error('[WorkflowScheduler] Failed to initialize:', err);
    }

    // Schedule the Delayed Execution Wakeup Task
    cron.schedule('* * * * *', async () => {
      try {
        const { rows } = await db.query(
          "SELECT id FROM workflow_executions WHERE status = 'paused' AND resume_at <= NOW()"
        );
        for (const row of rows) {
          console.log(`[WorkflowScheduler] Waking up delayed execution ${row.id}`);
          try {
            const runner = new WorkflowRunner();
            await runner.resume(row.id);
          } catch (e) {
            logger.error(`[WorkflowScheduler] Failed to resume execution ${row.id}:`, e);
          }
        }
      } catch (err) {
        logger.error('[WorkflowScheduler] Error checking for delayed executions:', err);
      }
    });
  }

  scheduleWorkflow(workflowId, triggerConfig) {
    // 1. Remove existing if any
    this.unscheduleWorkflow(workflowId);

    if (!triggerConfig || !triggerConfig.cron) {
      console.warn(`[WorkflowScheduler] Cannot schedule workflow ${workflowId}: missing cron expression.`);
      return false;
    }

    const cronExpression = triggerConfig.cron;
    
    if (!cron.validate(cronExpression)) {
      logger.error(`[WorkflowScheduler] Invalid cron expression for workflow ${workflowId}: ${cronExpression}`);
      return false;
    }

    // 2. Create the cron task
    const task = cron.schedule(cronExpression, async () => {
      console.log(`[WorkflowScheduler] Triggering workflow ${workflowId} via schedule.`);
      try {
        const runner = new WorkflowRunner();
        await runner.start(workflowId, { trigger: 'schedule', timestamp: new Date().toISOString() });
      } catch (err) {
        logger.error(`[WorkflowScheduler] Engine error while running workflow ${workflowId}:`, err);
      }
    });

    // 3. Keep track
    this.scheduledTasks.set(workflowId, task);
    console.log(`[WorkflowScheduler] Scheduled workflow ${workflowId} -> ${cronExpression}`);
    return true;
  }

  unscheduleWorkflow(workflowId) {
    if (this.scheduledTasks.has(workflowId)) {
      const task = this.scheduledTasks.get(workflowId);
      task.stop();
      this.scheduledTasks.delete(workflowId);
      console.log(`[WorkflowScheduler] Descheduled workflow ${workflowId}.`);
    }
  }

  reloadSpecific(workflowId, status, triggerType, triggerConfig) {
    if (status !== 'active' || triggerType !== 'schedule') {
      this.unscheduleWorkflow(workflowId);
    } else {
      this.scheduleWorkflow(workflowId, triggerConfig);
    }
  }
}

// Export singleton instance
module.exports = new WorkflowScheduler();
