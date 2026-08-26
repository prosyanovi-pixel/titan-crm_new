/**
 * Lawyers Module Settings
 */

module.exports = {
  display: {
    itemsPerPage: 20,
    defaultSort: 'name',
    defaultView: 'list',
  },
  features: {
    enableSpecializations: true,
    enableRating: true,
    enableHourlyRate: true,
    enableCaseAssignment: true,
    enableWorkloadTracking: true,
    enableStatistics: true,
  },
  defaults: {
    role: 'Юрист',
    department: 'Legal',
    status: 'active',
  },
};
