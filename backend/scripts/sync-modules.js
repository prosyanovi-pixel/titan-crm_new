const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { pathToFileURL } = require('url');
require('dotenv').config({ path: path.join(__dirname, '..', 'env') });

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const payloadArg = args.find(arg => arg.startsWith('--payload='));
const payloadPath = payloadArg ? path.resolve(process.cwd(), payloadArg.split('=')[1]) : null;

const port = process.env.PORT || '5000';
const apiBase = process.env.SYNC_MODULES_API_URL || `http://localhost:${port}/api`;

const defaultRegistrySeedPath = path.resolve(
  __dirname,
  '../../frontend/src/modules/registry/referenceSeeds.js'
);

const loadPayload = async () => {
  if (payloadPath) {
    if (!fs.existsSync(payloadPath)) {
      throw new Error(`Payload file not found: ${payloadPath}`);
    }

    const raw = fs.readFileSync(payloadPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.modules)) {
      throw new Error('Payload must contain { modules: [...] }');
    }

    return { payload: parsed, source: payloadPath };
  }

  if (!fs.existsSync(defaultRegistrySeedPath)) {
    throw new Error(`Registry seed file not found: ${defaultRegistrySeedPath}`);
  }

  const moduleUrl = pathToFileURL(defaultRegistrySeedPath).href;
  const imported = await import(moduleUrl);
  const modules = imported?.moduleReferenceSeeds;

  if (!Array.isArray(modules)) {
    throw new Error('moduleReferenceSeeds export is missing or invalid in frontend registry');
  }

  return {
    payload: { modules },
    source: defaultRegistrySeedPath,
  };
};

const run = async () => {
  const { payload, source } = await loadPayload();

  const url = `${apiBase}/references/sync-modules${isDryRun ? '?dryRun=true' : ''}`;
  const response = await axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
  });

  const data = response.data;

  console.log('=== Module Sync Result ===');
  console.log(`Source: ${source}`);
  console.log(`Mode: ${data.dryRun ? 'DRY-RUN' : 'APPLY'}`);
  console.log(`Synced modules: ${data.syncedModules}`);
  console.log(`Inserted quick actions: ${data.insertedQuickActions}`);
  console.log(`Skipped: ${data.skipped}`);

  if (data.report) {
    console.log('--- Report ---');
    console.log(`modules.inserted: ${data.report.modules?.inserted?.length || 0}`);
    console.log(`modules.updated: ${data.report.modules?.updated?.length || 0}`);
    console.log(`modules.unchanged: ${data.report.modules?.unchanged?.length || 0}`);
    console.log(`modules.invalid: ${data.report.modules?.invalid?.length || 0}`);
    console.log(`quickActions.inserted: ${data.report.quickActions?.inserted?.length || 0}`);
    console.log(`quickActions.existing: ${data.report.quickActions?.existing?.length || 0}`);
    console.log(`quickActions.invalid: ${data.report.quickActions?.invalid?.length || 0}`);
  }

  if ((data.report?.modules?.invalid?.length || 0) > 0 || (data.report?.quickActions?.invalid?.length || 0) > 0) {
    console.log('\nInvalid items:');
    console.log(JSON.stringify({
      modules: data.report.modules.invalid,
      quickActions: data.report.quickActions.invalid,
    }, null, 2));
  }
};

run().catch((error) => {
  const isConnectionRefused =
    error?.code === 'ECONNREFUSED' ||
    error?.cause?.code === 'ECONNREFUSED' ||
    error?.cause?.errors?.some?.((innerError) => innerError?.code === 'ECONNREFUSED');

  if (isConnectionRefused) {
    console.error('Module sync failed: backend API is not reachable.');
    console.error(`Tried URL: ${apiBase}/references/sync-modules`);
    console.error('Hint: start backend server first:');
    console.error('  cd backend && npm run dev');
    console.error('Or set custom API URL:');
    console.error('  SYNC_MODULES_API_URL=http://localhost:<PORT>/api npm run sync:modules:dry-run');
    process.exit(1);
  }

  const message = error?.response?.data || error?.message || error;
  console.error('Module sync failed:', message);
  process.exit(1);
});
