/**
 * Tasks Module Settings
 */

module.exports = {
  display: {
    itemsPerPage: 20,
    defaultSort: 'createdAt',
    defaultView: 'kanban',
  },
  features: {
    enableSubtasks: true,
    enableAssignees: true,
    enableDueDates: true,
    enablePriorities: true,
    enableStatistics: true,
  },
  defaults: {
    status: 'To Do',
    priority: 'Medium',
  },
};
