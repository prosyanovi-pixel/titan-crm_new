/**
 * Registry Module Settings
 * Contains configuration for the registry module functionality
 */

module.exports = {
  // Display settings
  display: {
    itemsPerPage: 50,
    defaultSort: 'date',
  },
  
  // Feature flags
  features: {
    enableSearch: true,
    enableFiltering: true,
    enableExports: true,
  },
  
  // Validation rules
  validation: {
    requiredFields: ['title'],
  },
  
  // Default values
  defaults: {
    status: 'active',
  },
};
