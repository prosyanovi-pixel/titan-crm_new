/**
 * Projects Module Settings
 */

module.exports = {
  display: {
    itemsPerPage: 20,
    defaultSort: 'name',
    showArchived: false,
    defaultView: 'list',
  },
  features: {
    enableMilestones: true,
    enableTeamMembers: true,
    enableTimeline: true,
    enableBudgeting: false,
    enableDocuments: true,
    enableTasks: true,
    enableStatistics: true,
  },
  defaults: {
    status: 'active',
    priority: 'medium',
  },
};
