/**
 * Contracts Module Settings
 */

module.exports = {
  display: {
    itemsPerPage: 20,
    defaultSort: 'createdAt',
    showExpired: false,
  },
  features: {
    enableSignatureTracking: true,
    enableExpirationAlerts: true,
    enableArchiving: true,
    enableVersioning: false,
    enableLinkedDocuments: true,
  },
  notifications: {
    alertDaysBeforeExpiry: 30,
    sendEmailOnExpiry: true,
  },
  defaults: {
    priority: 'medium',
  },
};
