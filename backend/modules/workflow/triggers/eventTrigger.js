const db = require('../../../db');
const WorkflowRunner = require('../engine/workflowRunner');
const logger = require('../../../utils/logger');
const eventBus = require('../../../utils/eventBus');

class EventTrigger {
  constructor() {
    this.subscribedEvents = new Map(); // Store handlers by workflowId
  }

  async initialize() {
    console.log('[EventTrigger] Initializing event-based workflows...');
    try {
      const result = await db.query(
        "SELECT id, trigger_config FROM workflows WHERE status = 'active' AND trigger_type = 'event'"
      );
      
      const workflows = result.rows;
      if (workflows.length === 0) {
        console.log('[EventTrigger] No active event-based workflows found.');
        return;
      }

      let subscribed = 0;
      for (const wf of workflows) {
        // db.query возвращает ключи в camelCase (toCamelCase в db.js), поэтому читаем оба варианта
        if (this.subscribeWorkflow(wf.id, wf.trigger_config ?? wf.triggerConfig)) {
          subscribed++;
        }
      }
      
      console.log(`[EventTrigger] Successfully subscribed ${subscribed}/${workflows.length} workflows.`);
    } catch (err) {
      logger.error('[EventTrigger] Failed to initialize:', err);
    }
  }

  subscribeWorkflow(workflowId, triggerConfig) {
    this.unsubscribeWorkflow(workflowId);

    if (!triggerConfig || !triggerConfig.eventName) {
      console.warn(`[EventTrigger] Cannot subscribe workflow ${workflowId}: missing eventName. trigger_config=${JSON.stringify(triggerConfig ?? null)}`);
      return false;
    }

    const eventName = triggerConfig.eventName;
    
    // Create the handler function
    const handler = async (payload) => {
      console.log(`[EventTrigger] Triggering workflow ${workflowId} due to event: ${eventName}`);
      try {
        const runner = new WorkflowRunner();
        await runner.start(workflowId, { trigger: 'event', eventName, payload });
      } catch (err) {
        logger.error(`[EventTrigger] Engine error while running workflow ${workflowId}:`, err);
      }
    };

    // Attach to event bus
    eventBus.on(eventName, handler);

    // Keep track so we can remove it later if workflow is paused/deleted
    this.subscribedEvents.set(workflowId, { eventName, handler });
    console.log(`[EventTrigger] Subscribed workflow ${workflowId} to event '${eventName}'`);
    return true;
  }

  unsubscribeWorkflow(workflowId) {
    if (this.subscribedEvents.has(workflowId)) {
      const { eventName, handler } = this.subscribedEvents.get(workflowId);
      eventBus.off(eventName, handler);
      this.subscribedEvents.delete(workflowId);
      console.log(`[EventTrigger] Unsubscribed workflow ${workflowId} from event '${eventName}'.`);
    }
  }

  reloadSpecific(workflowId, status, triggerType, triggerConfig) {
    if (status !== 'active' || triggerType !== 'event') {
      this.unsubscribeWorkflow(workflowId);
    } else {
      this.subscribeWorkflow(workflowId, triggerConfig);
    }
  }
}

module.exports = new EventTrigger();
