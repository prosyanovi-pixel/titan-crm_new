/**
 * Calendar Module Settings
 */

module.exports = {
  display: {
    itemsPerPage: 30,
    defaultSort: 'date',
    defaultView: 'calendar',
  },
  features: {
    enableEventNotifications: true,
    enableFollowUpTasks: true,
    enableClientNotifications: true,
    enableAssigneeNotifications: true,
    enableAllDayEvents: true,
    enableRecurringEvents: false,
  },
  defaults: {
    type: 'meeting',
    status: 'scheduled',
    allDay: false,
  },
};
