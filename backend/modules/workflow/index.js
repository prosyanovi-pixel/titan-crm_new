const router = require('./workflowRoutes');
const registry = require('./engine/workflowRegistry');
const runner = require('./engine/workflowRunner');
const scheduler = require('./triggers/scheduler');
const eventTrigger = require('./triggers/eventTrigger');

// Initialize the registry to load all available actions from other modules
registry.loadActions().catch(err => {
  // Log initialization errors in-memory (logger may not be available during init)
  console.error('[WorkflowRegistry] Failed to initialize registry:', err.message);
});

// Initialize the triggers
scheduler.initialize();
eventTrigger.initialize();

module.exports = {
  router,
  registry,
  runner,
  scheduler,
  eventTrigger
};
