const test = require('node:test');
const assert = require('node:assert');
const net = require('node:net');
const { spawn } = require('node:child_process');
const path = require('node:path');

require('dotenv').config({ path: path.join(__dirname, '..', 'env') });

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : null;
      server.close(() => resolve(port));
    });
  });
}

function startBackend(port) {
  const backendDir = path.join(__dirname, '..');
  const child = spawn(process.execPath, ['index.js'], {
    cwd: backendDir,
    env: {
      ...process.env,
      PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return new Promise((resolve, reject) => {
    let ready = false;

    const onData = (chunk) => {
      const output = chunk.toString();
      if (output.includes('Server running on http://0.0.0.0:')) {
        ready = true;
        cleanup();
        resolve(child);
      }
    };

    const onExit = (code) => {
      if (!ready) {
        cleanup();
        reject(new Error(`Backend exited before becoming ready (code ${code})`));
      }
    };

    const onError = (error) => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      child.stdout.off('data', onData);
      child.stderr.off('data', onData);
      child.off('exit', onExit);
      child.off('error', onError);
    };

    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.once('exit', onExit);
    child.once('error', onError);
  });
}

async function requestJson(url) {
  const response = await fetch(url, {
    headers: {
      'x-user-id': '1',
    },
  });

  const body = await response.json();
  return { response, body };
}

test('settings API keeps new and legacy routes wired together', async (t) => {
  const port = await getFreePort();
  const backend = await startBackend(port);

  t.after(() => {
    backend.kill('SIGTERM');
  });

  const baseUrl = `http://127.0.0.1:${port}`;

  const referenceData = await requestJson(`${baseUrl}/api/settings/reference-data`);
  assert.strictEqual(referenceData.response.status, 200);
  assert.ok(Array.isArray(referenceData.body.statuses), 'statuses array is missing');
  assert.ok(Array.isArray(referenceData.body.tags), 'tags array is missing');
  assert.ok(Array.isArray(referenceData.body.priorities), 'priorities array is missing');
  assert.ok(Array.isArray(referenceData.body.relationshipTypes), 'relationshipTypes array is missing');
  assert.ok(Array.isArray(referenceData.body.contractorTypes), 'contractorTypes array is missing');

  const endpoints = [
    '/api/settings/statuses',
    '/api/settings/tags',
    '/api/settings/priorities',
    '/api/statuses',
    '/api/tags',
    '/api/priorities',
  ];

  for (const endpoint of endpoints) {
    const result = await requestJson(`${baseUrl}${endpoint}`);
    assert.strictEqual(result.response.status, 200, `${endpoint} did not return 200`);
    assert.ok(Array.isArray(result.body.items), `${endpoint} items array is missing`);
    assert.strictEqual(typeof result.body.total, 'number', `${endpoint} total is not numeric`);
  }
});