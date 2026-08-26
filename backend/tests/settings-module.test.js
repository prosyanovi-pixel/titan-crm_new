const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const settingsModule = require('../modules/settings');

function getMountedRouters(router) {
  return (router.stack || [])
    .filter((layer) => layer && layer.name === 'router' && layer.handle)
    .map((layer) => layer.handle);
}

test('settings module exports the expected public API', () => {
  assert.strictEqual(settingsModule.prefix, '/api/settings');
  assert.ok(settingsModule.router, 'router export is missing');
  assert.ok(settingsModule.statusesRouter, 'statusesRouter export is missing');
  assert.ok(settingsModule.tagsRouter, 'tagsRouter export is missing');
  assert.ok(settingsModule.prioritiesRouter, 'prioritiesRouter export is missing');
  assert.ok(settingsModule.externalRouter, 'externalRouter export is missing');
  assert.ok(settingsModule.settings, 'settings export is missing');
});

test('settings module registers all nested routers', () => {
  const mountedRouters = getMountedRouters(settingsModule.router);

  assert.ok(mountedRouters.includes(settingsModule.statusesRouter), 'statusesRouter is not mounted');
  assert.ok(mountedRouters.includes(settingsModule.tagsRouter), 'tagsRouter is not mounted');
  assert.ok(mountedRouters.includes(settingsModule.prioritiesRouter), 'prioritiesRouter is not mounted');
  assert.ok(mountedRouters.includes(settingsModule.externalRouter), 'externalRouter is not mounted');
});

test('settings module exposes unified reference data endpoint', () => {
  const routePaths = (settingsModule.router.stack || [])
    .filter((layer) => layer && layer.route)
    .map((layer) => layer.route.path);

  assert.ok(routePaths.includes('/reference-data'), 'reference-data route is missing');
});

test('backend route registry keeps legacy settings aliases for frontend compatibility', () => {
  const registrySource = fs.readFileSync(path.join(__dirname, '..', 'utils', 'routeRegistry.js'), 'utf8');

  assert.match(registrySource, /'\/api\/statuses',\s*settingsModule\.statusesRouter/);
  assert.match(registrySource, /'\/api\/tags',\s*settingsModule\.tagsRouter/);
  assert.match(registrySource, /'\/api\/priorities',\s*settingsModule\.prioritiesRouter/);
});