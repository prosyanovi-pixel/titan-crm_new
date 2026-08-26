/**
 * Services Module Settings
 */

module.exports = {
  display: {
    itemsPerPage: 20,
    defaultSort: 'name',
  },
  features: {
    enableStatuses: true,
    enableTags: true,
    enableCategories: true,
    enableQuickActions: true,
  },
  types: [
    { id: 'pnr', name: 'ПНР', color: '#3b82f6' },
    { id: 'installation', name: 'Монтаж', color: '#10b981' },
    { id: 'delivery', name: 'Доставка', color: '#f59e0b' },
    { id: 'consulting', name: 'Консалтинг', color: '#8b5cf6' },
    { id: 'maintenance', name: 'Обслуживание', color: '#64748b' }
  ],
  tabs: []
};
