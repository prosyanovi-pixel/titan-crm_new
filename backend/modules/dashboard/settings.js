/**
 * Dashboard Module Settings
 */

module.exports = {
  display: {
    defaultView: 'stats',
    refreshInterval: 60000, // 1 minute
  },
  features: {
    enableStatistics: true,
    enableRecentActivities: true,
    enableUpcomingProjects: true,
    enableQuickStats: true,
    enableCharts: true,
  },
  stats: {
    showContractors: true,
    showActiveProjects: true,
    showTurnover: true,
    showTasks: true,
  },
};
