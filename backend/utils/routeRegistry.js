const settingsModule = require('../modules/settings');
const administrationModule = require('../modules/administration');
const profileModule = require('../modules/profile');

const legacyAdministrationRoutes = [
  ['/api/users', administrationModule.usersRouter],
  ['/api/roles', administrationModule.rolesRouter],
  ['/api/permissions', administrationModule.permissionsRouter],
  ['/api/employees', administrationModule.employeesRouter],
  ['/api/org', administrationModule.orgRouter],
  ['/api/company', administrationModule.companyRouter],
];

const legacySettingsRoutes = [
  ['/api/statuses', settingsModule.statusesRouter],
  ['/api/tags', settingsModule.tagsRouter],
  ['/api/priorities', settingsModule.prioritiesRouter],
];

const legacyProfileRoutes = [
  ['/api/profile', profileModule.router],
  ['/api/auth/me', profileModule.router],
];

const legacyAdminRoutes = [
  ['/api/admin', require('../modules/administration/routes/admin')],
];

const standardRoutes = [
  ['/api/search', require('../modules/search')],
  ['/api/references', require('../modules/references')],
  ['/api/courts', require('../modules/legal_cases/controllers/courts')],
  ['/api/contracts', require('../modules/contracts')],
  ['/api/quick-actions', require('../modules/quick_actions')],
  ['/api/user-settings', require('../modules/settings/routes/userSettings')],
  ['/api/module-settings', require('../modules/settings/routes/moduleSettings')],
  ['/api/system-settings', require('../modules/settings/routes/systemSettings')],
  ['/api/notifications', require('../modules/notifications')],
  ['/api/case-outcomes', require('../modules/legal_cases/controllers/caseOutcomes')],
  ['/api/warehouse', require('../modules/warehouse')],
  ['/api/sales', require('../modules/sales')],
];

module.exports = {
  legacyAdministrationRoutes,
  legacySettingsRoutes,
  legacyProfileRoutes,
  legacyAdminRoutes,
  standardRoutes,
};