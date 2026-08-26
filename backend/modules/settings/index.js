/**
 * Главный файл модуля Settings
 * Объединяет управление справочниками (статусы, теги, приоритеты)
 */

const settings = require('./settings');
const router = require('./routes');
const statusesRouter = require('./controllers/statuses');
const tagsRouter = require('./controllers/tags');
const prioritiesRouter = require('./controllers/priorities');
const externalRouter = require('./controllers/external');

module.exports = {
  router,
  settings,
  statusesRouter,
  tagsRouter,
  prioritiesRouter,
  externalRouter,
  prefix: '/api/settings',
};
