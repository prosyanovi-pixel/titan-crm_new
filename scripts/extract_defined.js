const fs = require('fs');
const path = require('path');

// Read the settings.ts translation file
const settingsTsPath = 'C:\\Users\\Федя\\Documents\\titan-crm\\frontend\\src\\modules\\settings\\i18n\\ru\\settings.ts';
const generalTsPath = 'C:\\Users\\Федя\\Documents\\titan-crm\\frontend\\src\\lib\\i18n\\locales\\ru\\general.ts';
const notificationsTsPath = 'C:\\Users\\Федя\\Documents\\titan-crm\\frontend\\src\\lib\\i18n\\locales\\ru\\notifications.ts';
const commonTsPath = 'C:\\Users\\Федя\\Documents\\titan-crm\\frontend\\src\\lib\\i18n\\locales\\ru\\common.ts';

function extractKeysFromTS(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const keys = new Set();
  // Match all string keys in objects: "key": "value" or key: "value"
  // Also match template literal keys
  const keyRegex = /["']?([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*|\$\{[^}]+\})*)["']?\s*:/g;
  let match;
  while ((match = keyRegex.exec(content)) !== null) {
    keys.add(match[1]);
  }
  return keys;
}

function extractGeneratedKeys(content) {
  const keys = new Set();
  const keyRegex = /["']([a-zA-Z_]\w*(?:\.\w+|\$\{[^}]+\})*)["']\s*:/g;
  let match;
  while ((match = keyRegex.exec(content)) !== null) {
    const key = match[1];
    if (key.includes('.') || key === 'generated') {
      keys.add(key);
    }
  }
  return keys;
}

// Extract keys from settings.ts
const settingsContent = fs.readFileSync(settingsTsPath, 'utf8');
const generalContent = fs.readFileSync(generalTsPath, 'utf8');
const notificationsContent = fs.readFileSync(notificationsTsPath, 'utf8');

// Parse settings.ts keys (settings.*)
const settingsDefinedKeys = new Set();
function findStringKeys(obj, prefix = '') {
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      findStringKeys(obj[key], fullKey);
    } else if (typeof obj[key] === 'string') {
      settingsDefinedKeys.add(fullKey);
    }
  }
}

// We need to actually eval the module to get the keys - but it has imports
// Let's parse manually instead

// For generated.* keys from general.ts
const generatedKeysInGeneral = new Set();
const genRegex = /["']([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*)["']\s*:/g;
let m;
// We need to extract keys from the generated object in general.ts
const genMatch = generalContent.match(/export const generated\s*=\s*\{([\s\S]*)\}\s*;$/);
if (genMatch) {
  const genContent = genMatch[1];
  while ((m = /["']([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*)*)["']\s*:/g.exec(genContent)) !== null) {
    generatedKeysInGeneral.add('generated.' + m[1]);
  }
}

// Parse general.ts more carefully
const generalKeysInGeneral = new Set();
function extractObjectKeysFromTS(content, namespace) {
  const keys = new Set();
  // Simple approach: find all property definitions
  const propRegex = /["']?([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*|\$\{[^}]+\})*)["']?\s*:/g;
  let match;
  while ((match = propRegex.exec(content)) !== null) {
    keys.add(namespace + '.' + match[1]);
  }
  return keys;
}

// Let's just use the node require approach
console.log("Loading modules...");

// Since modules have imports, let's try a different approach - parse the file manually
console.log("=== Settings keys from translation file (settings.ts) ===");

// Manually extract from settings.ts by reading and parsing
function extractAllStringKeys(content) {
  const keys = new Set();
  // Match property keys in objects: key: or "key":
  const propRegex = /(?:"([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*|\$\{[^}]+\})*)"|'([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*|\$\{[^}]+\})*)'|([a-zA-Z_]\w*(?:\.[a-zA-Z_]\w*|\$\{[^}]+\})*))\s*:/g;
  let match;
  while ((match = propRegex.exec(content)) !== null) {
    const key = match[1] || match[2] || match[3];
    if (key && !['export', 'const', 'import', 'from'].includes(key.split('.')[0])) {
      keys.add(key);
    }
  }
  return keys;
}

const settingsKeys = extractAllStringKeys(settingsContent);
const generalKeysAll = extractAllStringKeys(generalContent);

console.log("Settings translation keys found:");
[...settingsKeys].sort().forEach(k => console.log("settings." + k));

console.log("\nGeneral translation file keys (generated.* and general.*):");
[...generalKeysAll].filter(k => !k.startsWith('useTranslation') && !k.startsWith('React')).sort().forEach(k => {
  if (k.includes('.')) {
    console.log(k);
  } else {
    console.log('generated.' + k);
  }
});
