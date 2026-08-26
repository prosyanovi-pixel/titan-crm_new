/**
 * Workflow Module Settings
 */

module.exports = {
  display: {
    itemsPerPage: 20,
    defaultSort: 'created_at',
    defaultView: 'table',
  },
  features: {
    enableScheduler:   true,
    enableWebhooks:    true,
    enableConditions:  true,
    enableExecutionLog: true,
  },
  defaults: {
    status:   'draft',
    on_fail:  'skip',
    attachmentsDir: 'uploads/documents/workflow',
  },
};
