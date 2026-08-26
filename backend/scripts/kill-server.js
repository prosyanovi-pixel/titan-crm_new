/**
 * Кросс-платформенная остановка backend-сервера (node index.js / nodemon).
 * Windows : taskkill /F /FI "WINDOWTITLE eq *index.js*"  +  wmic fallback
 * Unix/macOS: pkill -f "node index.js" || pkill -f nodemon
 */
const { execSync } = require('child_process');
const os = require('os');

const isWindows = os.platform() === 'win32';

function run(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit' });
    return true;
  } catch (_) {
    return false;
  }
}

if (isWindows) {
  // На Windows ищем все процессы node.exe, у которых в командной строке есть index.js или nodemon
  console.log('🛑 Останавливаем сервер (Windows)...');
  const killed =
    run('wmic process where "name=\'node.exe\' and commandline like \'%index.js%\'" delete') ||
    run('taskkill /F /IM node.exe');

  if (killed) {
    console.log('✅ Сервер остановлен');
  } else {
    console.log('ℹ️  Сервер не был запущен (или уже остановлен)');
  }
} else {
  // macOS / Linux
  console.log('🛑 Останавливаем сервер (Unix/macOS)...');
  const killed =
    run("pkill -f 'node index.js'") ||
    run("pkill -f 'nodemon index.js'") ||
    run("pkill -f nodemon");

  if (killed) {
    console.log('✅ Сервер остановлен');
  } else {
    console.log('ℹ️  Сервер не был запущен (или уже остановлен)');
  }
}
