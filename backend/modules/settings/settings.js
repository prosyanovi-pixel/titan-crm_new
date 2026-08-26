/**
 * Settings Module Configuration
 */

module.exports = {
  // Modules supported by statuses and tags
  supportedModules: [
    'contractors',
    'projects',
    'tasks',
    'lawyers',
    'cases',
    'finance',
    'documents',
    'mail',
    'reports'
  ],

  
  // Default values for new reference items
  defaults: {
    color: '#6B7280',
    displayOrder: 0
  },
  
  // Display settings for settings management UI
  display: {
    itemsPerPage: 50,
    defaultSort: 'displayOrder'
  }
};
