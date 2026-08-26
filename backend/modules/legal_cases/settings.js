/**
 * Legal Cases Module Settings
 */

module.exports = {
  display: {
    itemsPerPage: 20,
    defaultSort: 'createdAt',
    defaultView: 'list',
    showClosed: false,
  },
  features: {
    enableDocumentTracking: true,
    enableReminders: true,
    enableReporting: true,
    enableHearingSchedule: true,
    enableCostsTracking: true,
    enableThirdParties: true,
    enableNotes: true,
    enableAttachments: true,
  },
  defaults: {
    priority: 'medium',
    status: 'new',
  },
};
