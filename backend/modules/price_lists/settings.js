/**
 * Price Lists Module Settings
 */
module.exports = {
  display: {
    itemsPerPage: 20,
    defaultSort: 'name',
    showInactive: false,
    defaultCurrency: 'RUB',
    showItemImages: true,
  },
  features: {
    enableStatuses: true,
    enableTags: true,
    enableCategories: true,
    enableQuickActions: true,
    enableDiscountRules: true,
    enableTaxCalculation: true,
    enableBulkUpdates: true,
  },
  defaults: {
    status: 'active',
    currency: 'RUB',
  },
  pricing: {
    allowNegativePrices: false,
    requireApprovalForDiscounts: false,
    maxDiscountPercent: 10,
    roundingRule: 'none',
  },
};
