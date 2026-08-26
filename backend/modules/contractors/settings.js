/**
 * Contractors Module Settings
 */

module.exports = {
  display: {
    itemsPerPage: 20,
    defaultSort: 'name',
    showInactive: false,
  },
  features: {
    enableRating: true,
    enableTags: true,
    enableCategories: true,
    enableQuickActions: true,
    enableEnrichment: true,
    enableStatistics: true,
  },
  enrichment: {
    provider: 'dadata',
    autoEnrichOnCreate: false,
  },
  defaults: {
    status: 'active',
    type: 'individual',
  },
};
