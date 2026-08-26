/**
 * Products Module Settings
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
    { id: 'equipment', name: 'Оборудование', color: '#3b82f6' },
    { id: 'material', name: 'Материал', color: '#10b981' },
    { id: 'software', name: 'ПО', color: '#8b5cf6' }
  ],
  tabs: []
};
