
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIGURATION ---
const ROOT_DIR = 'src'; // Directory to scan
const OUTPUT_JSON = 'missing_locales.json'; // Output file for new keys
const KEY_PREFIX = 'generated'; // Prefix for auto-generated keys
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx']);

function parseCliArgs() {
  const args = process.argv.slice(2);
  let rootDir = ROOT_DIR;
  let outputJson = OUTPUT_JSON;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    const next = args[i + 1];

    if (arg === '--root' && next) {
      rootDir = next;
      i += 1;
      continue;
    }

    if (arg.startsWith('--root=')) {
      rootDir = arg.slice('--root='.length);
      continue;
    }

    if (arg === '--output' && next) {
      outputJson = next;
      i += 1;
      continue;
    }

    if (arg.startsWith('--output=')) {
      outputJson = arg.slice('--output='.length);
    }
  }

  return { rootDir, outputJson };
}

// 1. Attributes to check for hardcoded strings in JSX
// Added: subtitle, breadcrumb, tooltip, heading
const TARGET_ATTRIBUTES = [
  'placeholder', 'title', 'label', 'alt', 'description', 
  'subtitle', 'breadcrumb', 'tooltip', 'heading', 'text'
];

// 2. Function calls to check for hardcoded strings (e.g. toast.success("Текст"))
const TARGET_FUNCTIONS = [
  'confirm', 
  'toast', 
  'toast\\.success', 
  'toast\\.error', 
  'toast\\.info', 
  'toast\\.warning',
  'toast\\.message'
];

// --- UTILS ---

const transliterate = (text) => {
  const ru = "А-а-Б-б-В-в-Г-г-Д-д-Е-е-Ё-ё-Ж-ж-З-з-И-и-Й-й-К-к-Л-л-М-м-Н-н-О-о-П-п-Р-р-С-с-Т-т-У-у-Ф-ф-Х-х-Ц-ц-Ч-ч-Ш-ш-Щ-щ-Ъ-ъ-Ы-ы-Ь-ь-Э-э-Ю-ю-Я-я".split("-");
  const en = "A-a-B-b-V-v-G-g-D-d-E-e-E-e-Zh-zh-Z-z-I-i-Y-y-K-k-L-l-M-m-N-n-O-o-P-p-R-r-S-s-T-t-U-u-F-f-H-h-Ts-ts-Ch-ch-Sh-sh-Sch-sch-'-'-Y-y-'-'-E-e-Yu-yu-Ya-ya".split("-");
  let res = text;
  for (let i = 0, l = ru.length; i < l; i++) {
    const reg = new RegExp(ru[i], "g");
    res = res.replace(reg, en[i]);
  }
  return res
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 40); // Limit key length
};

const newTranslations = {};
const scanStats = {
  filesScanned: 0,
  hits: {
    jsxText: 0,
    attributes: 0,
    functions: 0,
  },
};

function isLikelyNaturalLanguage(text) {
  const trimmed = text.trim();

  if (!trimmed || trimmed.length < 2 || trimmed.length > 160) {
    return false;
  }

  if (!/[а-яА-ЯёЁ]/.test(trimmed)) {
    return false;
  }

  if (/\r|\n|\t/.test(trimmed)) {
    return false;
  }

  // Skip fragments that are likely code snippets rather than UI strings.
  if (/\b(const|let|var|function|return|useState|useEffect)\b/.test(trimmed)) {
    return false;
  }

  if (/[{}]|=>/.test(trimmed)) {
    return false;
  }

  return true;
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'lib' && file !== 'locales' && file !== 'dist') {
        scanDirectory(filePath);
      }
    } else if (SOURCE_EXTENSIONS.has(path.extname(file))) {
      processFile(filePath);
    }
  });
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const ext = path.extname(filePath);
  const isTsx = ext === '.tsx';
  scanStats.filesScanned += 1;

  // 1. Scan JSX text content: <div>Текст</div>
  if (isTsx) {
    const jsxTextRegex = />([^<>{}]*[а-яА-ЯёЁ][^<>{}]*)</g;

    content.replace(jsxTextRegex, (match, text) => {
      const trimmedText = text.trim();
      if (!isLikelyNaturalLanguage(trimmedText)) return match;

      const key = `${KEY_PREFIX}.${transliterate(trimmedText)}`;
      if (!newTranslations[key]) {
        newTranslations[key] = trimmedText;
      }
      scanStats.hits.jsxText += 1;
      return match;
    });
  }

  // 2. Scan attribute values: placeholder="Текст"
  if (isTsx) {
    TARGET_ATTRIBUTES.forEach(attr => {
      const simpleAttrRegex = new RegExp(`\\b(${attr})=(["'])([^"']*?[а-яА-ЯёЁ][^"']*?)\\2`, 'g');

      content.replace(simpleAttrRegex, (match, attributeName, quote, text) => {
        const trimmedText = text.trim();
        if (!isLikelyNaturalLanguage(trimmedText)) return match;

        const key = `${KEY_PREFIX}.${transliterate(trimmedText)}`;
        if (!newTranslations[key]) {
          newTranslations[key] = trimmedText;
        }
        scanStats.hits.attributes += 1;
        return match;
      });
    });
  }

  // 3. Scan function arguments: toast.success("Текст")
  TARGET_FUNCTIONS.forEach(func => {
    const funcRegex = new RegExp(`(${func})\\s*\\(\\s*(["'])([^"']*?[а-яА-ЯёЁ][^"']*?)\\2`, 'g');

    content.replace(funcRegex, (match, funcName, quote, text) => {
      const trimmedText = text.trim();
      if (!isLikelyNaturalLanguage(trimmedText)) return match;

      const key = `${KEY_PREFIX}.${transliterate(trimmedText)}`;
      if (!newTranslations[key]) {
        newTranslations[key] = trimmedText;
      }
      scanStats.hits.functions += 1;
      return match;
    });
  });
}

// --- EXECUTION ---

console.log('🔍 Scanning for hardcoded Russian strings...');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { rootDir, outputJson } = parseCliArgs();
const rootPath = path.resolve(__dirname, '..', rootDir);

if (!fs.existsSync(rootPath)) {
  console.error(`❌ Scan root does not exist: ${rootPath}`);
  process.exit(1);
}

scanDirectory(rootPath);

// Write results
const sortedKeys = Object.keys(newTranslations).sort().reduce((acc, key) => {
  acc[key] = newTranslations[key];
  return acc;
}, {});

const outputPath = path.resolve(__dirname, '..', outputJson);
fs.writeFileSync(outputPath, JSON.stringify(sortedKeys, null, 2), 'utf-8');

console.log('--------------------------------------------------');
console.log(`✅ Done!`);
console.log(`📁 Scanned files: ${scanStats.filesScanned}`);
console.log(
  `🔎 Matches: jsx=${scanStats.hits.jsxText}, attributes=${scanStats.hits.attributes}, functions=${scanStats.hits.functions}`
);
console.log(`💾 Generated ${Object.keys(newTranslations).length} new keys in ${outputJson}`);
console.log(`👉 Step 1: Copy keys from ${outputJson} to src/lib/i18n/locales/ru/general.ts`);
console.log('👉 Source files are not modified by this script.');
