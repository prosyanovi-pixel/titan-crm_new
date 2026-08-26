import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Скрипт для проверки наличия всех ключей локализации в коде.
 * Сканирует src на наличие t('key') или t("key") и проверяет их в словарях ru.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const I18N_ROOT = 'src/lib/i18n/locales/ru';
const SRC_DIR = 'src';
const CONTAINER_MODULES = ['business', 'legal', 'office', 'layout'];

function run() {
  const frontendRoot = path.resolve(__dirname, '..');
  const i18nPath = path.join(frontendRoot, I18N_ROOT);
  const srcPath = path.join(frontendRoot, SRC_DIR);

  console.log(`${COLORS.bright}${COLORS.cyan}🚀 Начинаю аудит локализации...${COLORS.reset}`);

  // 1. Сбор словарей
  const definedKeys = {};
  const visitedFiles = new Map();

  function resolvePath(importPath, currentFileDir) {
    let resolvedPath = importPath;
    if (importPath.startsWith('@/')) {
      resolvedPath = path.join(frontendRoot, 'src', importPath.replace('@/', ''));
    } else if (importPath.startsWith('./') || importPath.startsWith('../')) {
      resolvedPath = path.resolve(currentFileDir, importPath);
    } else {
      return null;
    }

    const extensions = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];
    for (const ext of extensions) {
      if (fs.existsSync(resolvedPath + ext) && !fs.statSync(resolvedPath + ext).isDirectory()) {
         return resolvedPath + ext;
      }
    }
    
    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
        const indexTs = path.join(resolvedPath, 'index.ts');
        if (fs.existsSync(indexTs)) return indexTs;
        const indexTsx = path.join(resolvedPath, 'index.tsx');
        if (fs.existsSync(indexTsx)) return indexTsx;
    }

    return null;
  }

  function buildImportMap(content, filePath) {
    const imports = {};
    
    // import defaultName from 'path'
    const defaultImportRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = defaultImportRegex.exec(content)) !== null) {
      imports[match[1]] = { sourcePath: resolvePath(match[2], path.dirname(filePath)), exportName: 'default' };
    }

    // import { a, b as c } from 'path'
    const namedImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
    let namedMatch;
    while ((namedMatch = namedImportRegex.exec(content)) !== null) {
      const items = namedMatch[1].split(',').map(s => s.trim());
      const srcPath = resolvePath(namedMatch[2], path.dirname(filePath));
      for (const item of items) {
        const parts = item.split(/\s+as\s+/);
        const originalName = parts[0].trim();
        const localName = (parts[1] || parts[0]).trim();
        imports[localName] = { sourcePath: srcPath, exportName: originalName };
      }
    }

    // import * as namespace from 'path'
    const namespaceImportRegex = /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
    while ((match = namespaceImportRegex.exec(content)) !== null) {
      imports[match[1]] = { sourcePath: resolvePath(match[2], path.dirname(filePath)), exportName: null, isNamespace: true };
    }

    return imports;
  }

  function extractAllKeys(content, prefix, exportNameFilter, filePath, imports) {
    const keys = {};
    imports = imports || {};
    const cleanContent = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
    
    // 1. Топ-левел константы и алиасы: export const name = { ... } или export const name = identifier
    const constRegex = /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*/g;
    let match;
    while ((match = constRegex.exec(cleanContent)) !== null) {
      const varName = match[1];
      const restStart = constRegex.lastIndex;
      const rest = cleanContent.slice(restStart).trimStart();
      
      if (exportNameFilter && varName !== exportNameFilter) continue;

      if (rest.startsWith('{')) {
        // Object literal
        let newPrefix = prefix;
        if (!CONTAINER_MODULES.includes(varName) && varName !== 'default') {
          const isRedundant = prefix === varName || prefix.endsWith('.' + varName) || (exportNameFilter && varName === exportNameFilter);
          if (!isRedundant) {
            newPrefix = prefix ? `${prefix}.${varName}` : varName;
          }
        }
        
        let braceCount = 1;
        let i = restStart + 1;
        while (braceCount > 0 && i < cleanContent.length) {
          if (cleanContent[i] === '{') braceCount++;
          else if (cleanContent[i] === '}') braceCount--;
          i++;
        }
        const body = cleanContent.substring(restStart + 1, i - 1);
        Object.assign(keys, extractAllKeysInternal(body, newPrefix, imports, filePath));
        constRegex.lastIndex = i;
      } else {
        // Could be an alias: export const foo = bar or export const foo = bar.baz
        const aliasMatch = rest.match(/^([\w.]+)/);
        if (aliasMatch) {
          const sourcePath = aliasMatch[1].split('.');
          const sourceVar = sourcePath[0];
          const subPath = sourcePath.slice(1);
          
          const importInfo = imports[sourceVar];
          if (importInfo && importInfo.sourcePath) {
            const subExportName = subPath.length > 0 ? subPath[subPath.length - 1] : importInfo.exportName || sourceVar;
            const isSameName = varName === subExportName;
            const nextPrefix = isSameName ? prefix : (prefix ? `${prefix}.${varName}` : varName);
            Object.assign(keys, processI18nFile(importInfo.sourcePath, nextPrefix, subExportName, true));
          } else {
            // Local variable (defined in same file)
            const nestedKeys = extractAllKeys(cleanContent, prefix, sourceVar, filePath, imports);
            const searchPrefix = prefix ? `${prefix}.${sourceVar}.${varName}` : `${sourceVar}.${varName}`;
            Object.entries(nestedKeys).forEach(([k, v]) => {
              if (k.startsWith(searchPrefix + '.')) {
                keys[k.replace(searchPrefix + '.', prefix ? prefix + '.' : '')] = v;
              } else {
                keys[k] = v;
              }
            });
          }
        }
      }
    }

    if (!exportNameFilter) {
       Object.assign(keys, extractAllKeysInternal(cleanContent, prefix, imports, filePath));
    }
    
    return keys;
  }

  function extractAllKeysInternal(content, prefix = '', imports, filePath) {
    imports = imports || {};
    const keys = {};
    const propRegex = /(['"]?)([\w\-\/]+(?:[\s]+[\w\-\/]+)*)\1\s*:\s*(\{?)/g;
    let match;
    
    const processedKeys = new Set();
    
    while ((match = propRegex.exec(content)) !== null) {
      const keyName = match[2];
      processedKeys.add(keyName);
      const isObject = match[3] === '{';
      const newPrefix = prefix ? `${prefix}.${keyName}` : keyName;
      
      if (isObject) {
        let braceCount = 1;
        let i = propRegex.lastIndex;
        while (braceCount > 0 && i < content.length) {
          if (content[i] === '{') braceCount++;
          else if (content[i] === '}') braceCount--;
          i++;
        }
        const body = content.substring(propRegex.lastIndex, i - 1);
        Object.assign(keys, extractAllKeysInternal(body, newPrefix, imports, filePath));
        propRegex.lastIndex = i;
      } else {
        // Check if the value is a known imported variable (object reference)
        // Read the value after the colon
        let valueStr = '';
        let i = propRegex.lastIndex;
        let inString = null;
        let parenDepth = 0;
        while (i < content.length) {
          const char = content[i];
          if (inString) {
            if (char === inString && content[i-1] !== '\\') inString = null;
            valueStr += char;
          } else {
            if (char === '"' || char === "'") inString = char;
            else if (char === '(') parenDepth++;
            else if (char === ')') parenDepth--;
            else if ((char === ',' || char === '}' || char === '\n') && parenDepth === 0) break;
            else if (char === '/' && content[i+1] === '/') break;
            valueStr += char;
          }
          i++;
        }
        propRegex.lastIndex = i;
        
        const trimmedValue = valueStr.trim();
        
        // Check if value is a word (identifier) referencing an imported object
        const wordMatch = trimmedValue.match(/^([\w.]+)$/);
        if (wordMatch) {
          const pathParts = wordMatch[1].split('.');
          const valName = pathParts[0];
          const importInfo = imports[valName];
          if (importInfo && importInfo.sourcePath) {
            const subExportName = importInfo.exportName || valName;
            // Extract the keys from the referenced file using its export name as the prefix
            const referencedKeys = processI18nFile(importInfo.sourcePath, subExportName, subExportName, true);
            const subPathStr = pathParts.join('.');
            Object.keys(referencedKeys).forEach(k => {
              if (k === subPathStr) {
                keys[newPrefix] = true;
              } else if (k.startsWith(subPathStr + '.')) {
                const suffix = k.substring(subPathStr.length + 1);
                keys[newPrefix ? newPrefix + '.' + suffix : suffix] = true;
              }
            });
            continue;
          }
        }
        
        keys[newPrefix] = true;
      }
    }

    // Handle shorthand properties: { foo, bar }
    const shorthandRegex = /(\w+)(?=\s*[,}]\s*)/g;
    let shorthandMatch;
    while ((shorthandMatch = shorthandRegex.exec(content)) !== null) {
      const name = shorthandMatch[1];
      if (processedKeys.has(name)) continue;
      if (['true', 'false', 'null', 'undefined', 'void', 'typeof', 'const', 'let', 'var', 'import', 'export', 'return', 'if', 'else', 'for', 'while', 'function', 'class', 'new', 'this', 'throw', 'try', 'catch', 'finally', 'case', 'break', 'default', 'switch', 'continue', 'yield', 'async', 'await', 'from', 'as', 'of', 'in'].includes(name)) continue;
      
      const newPrefix = prefix ? `${prefix}.${name}` : name;
      
      // Check if it's a reference to an imported object
      const importInfo = imports[name];
      if (importInfo && importInfo.sourcePath) {
        Object.assign(keys, processI18nFile(importInfo.sourcePath, newPrefix, importInfo.exportName || name, true));
      } else {
        keys[newPrefix] = true;
      }
    }

    // Handle spread operator: ...name
    const spreadRegex = /\.\.\.(\w+)/g;
    let spreadMatch;
    while ((spreadMatch = spreadRegex.exec(content)) !== null) {
      const name = spreadMatch[1];
      const importInfo = imports[name];
      if (importInfo && importInfo.sourcePath) {
        Object.assign(keys, processI18nFile(importInfo.sourcePath, prefix, importInfo.exportName || name, true));
      } else {
        // Try local definition
        const nestedKeys = extractAllKeys(content, prefix, name, filePath, imports);
        Object.assign(keys, nestedKeys);
      }
    }
    
    return keys;
  }

  function processI18nFile(filePath, prefix = '', limitToExport = null, returnKeys = false) {
    const cacheKey = `${filePath}::${prefix}::${limitToExport}`;
    if (visitedFiles.has(cacheKey)) {
      return { ...visitedFiles.get(cacheKey) };
    }
    visitedFiles.set(cacheKey, {});

    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, 'utf-8');
    const cleanContent = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
    const keys = {};
    const imports = buildImportMap(content, filePath);

    // 1. Извлекаем ключи из самого файла
    Object.assign(keys, extractAllKeys(content, prefix, limitToExport, filePath, imports));

    // 2. Ищем ре-экспорты типа: export * from './path'
    const starMatches = content.matchAll(/export\s+\*\s+from\s+['"]([^'"]+)['"]/g);
    for (const match of starMatches) {
      const nextPath = resolvePath(match[1], path.dirname(filePath));
      if (nextPath) Object.assign(keys, processI18nFile(nextPath, prefix));
    }

    // 3. Именованные ре-экспорты: export { a, b as c } from './path'
    const namedReexportRegex = /export\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
    let namedMatch;
    while ((namedMatch = namedReexportRegex.exec(cleanContent)) !== null) {
      const items = namedMatch[1].split(',').map(s => s.trim());
      const nextPath = resolvePath(namedMatch[2], path.dirname(filePath));
      if (nextPath) {
        for (const item of items) {
          const parts = item.split(/\s+as\s+/);
          const originalName = parts[0].trim();
          const exportName = (parts[1] || parts[0]).trim();
          
          const isRedundant = prefix === exportName || prefix.endsWith('.' + exportName);
          const nextPrefix = (CONTAINER_MODULES.includes(exportName) || isRedundant) 
                             ? prefix 
                             : (prefix ? `${prefix}.${exportName}` : exportName);
          
          Object.assign(keys, processI18nFile(nextPath, nextPrefix, originalName, true));
        }
      }
    }

    // 4. Простые именованные экспорты (без from): export { a, b }
    const localExportRegex = /export\s+\{([^}]+)\}(?!\s+from)/g;
    let localMatch;
    while ((localMatch = localExportRegex.exec(cleanContent)) !== null) {
      const items = localMatch[1].split(',').map(s => s.trim());
      for (const item of items) {
          const parts = item.split(/\s+as\s+/);
          const originalName = parts[0].trim();
          const exportName = (parts[1] || parts[0]).trim();
          
          const isRedundant = prefix === exportName || prefix.endsWith('.' + exportName);
          const nextPrefix = (CONTAINER_MODULES.includes(exportName) || isRedundant) 
                             ? prefix 
                             : (prefix ? `${prefix}.${exportName}` : exportName);
                             
          Object.assign(keys, extractAllKeys(cleanContent, nextPrefix, originalName, filePath, imports));
      }
    }

    // 5. Дефолтный экспорт: export default name
    const defaultExportRegex = /export\s+default\s+([\w]+)/g;
    let defaultMatch;
    while ((defaultMatch = defaultExportRegex.exec(cleanContent)) !== null) {
        const name = defaultMatch[1];
        if (limitToExport === 'default' || !limitToExport) {
            Object.assign(keys, extractAllKeys(cleanContent, prefix, name, filePath, imports));
        }
    }

    if (!returnKeys) {
        Object.assign(definedKeys, keys);
    }
    visitedFiles.set(cacheKey, keys);
    return keys;
  }

  const indexFile = path.join(i18nPath, 'index.ts');
  if (!fs.existsSync(indexFile)) {
     console.error(`${COLORS.red}Файл индекса i18n не найден: ${indexFile}${COLORS.reset}`);
      process.exitCode = 1;
     return;
  }

  processI18nFile(indexFile);

  // Алиасы generated.*
  Object.keys(definedKeys).forEach(k => {
    const alias = k.startsWith('lost.') ? k.replace('lost.', 'generated.') : 
                 k.startsWith('general.generated.') ? k.replace('general.generated.', 'generated.') : null;
    if (alias) definedKeys[alias] = true;
  });

  // Алиасы modules.* → корень (для модулей, не имеющих прямого экспорта)
  // modules.contractors.xxx → contractors.xxx, modules.documents.xxx → documents.xxx, etc.
  const modulesPrefixKeys = Object.keys(definedKeys).filter(k => k.startsWith('modules.'));
  modulesPrefixKeys.forEach(k => {
    const alias = k.replace('modules.', '');
    if (!definedKeys[alias]) {
      definedKeys[alias] = true;
    }
  });

  console.log(`${COLORS.green}✅ Словари собраны. Всего уникальных ключей: ${Object.keys(definedKeys).length}${COLORS.reset}`);

  // DEBUG: Check specific keys
  const debugKeys = [
    'contractors.enrichment.error_search',
    'contractors.messages.updated_fields',
    'contractors.enrichment.error_apply',
    'contractors.messages.call',
    'contractors.title',
    'contractors.subtitle',
    'business.confirm.delete_task',
    'business.confirm',
    'business.validation.title_required',
    'business.validation',
    'profile.notifications.email.title',
    'profile.personal.full_name',
    'projects.stages.task_status.To Do',
    'projects.title',
  ];
  debugKeys.forEach(k => {
    console.log(`  DEBUG: ${k}: ${definedKeys[k] ? 'HIT' : 'MISS'}`);
  });

  // 2. Сканирование кода
  function getFiles(dir, exts) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      file = path.join(dir, file);
      const stat = fs.statSync(file);
      if (stat && stat.isDirectory()) {
        if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('.next')) {
          results = results.concat(getFiles(file, exts));
        }
      } else {
        if (exts.includes(path.extname(file))) {
          results.push(file);
        }
      }
    });
    return results;
  }

  const sourceFiles = getFiles(srcPath, ['.ts', '.tsx']);
  const missingKeysByFile = {};
  const dynamicKeys = [];

  console.log(`${COLORS.blue}🔍 Сканирую исходный код (${sourceFiles.length} файлов)...${COLORS.reset}`);

  sourceFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Blank out comments to avoid finding t('key') inside comments, preserving offsets and line numbers
    const cleanContent = content.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
                                .replace(/\/\/.*/g, (m) => ' '.repeat(m.length));

    // Regex для t('key') или t("key") или t(`key`)
    const tRegex = /\bt\s*\(\s*(['"`])(.*?)\1/g;
    let match;
    while ((match = tRegex.exec(cleanContent)) !== null) {
      const key = match[2];
      
      if (key.includes('${')) {
        dynamicKeys.push({ key, file: filePath });
        continue;
      }

      if (!definedKeys[key]) {
        if (!missingKeysByFile[filePath]) missingKeysByFile[filePath] = [];
        const offset = match.index;
        let lineNum = 1;
        let currentOffset = 0;
        for (let i = 0; i < lines.length; i++) {
          currentOffset += lines[i].length + 1;
          if (currentOffset > offset) {
            lineNum = i + 1;
            break;
          }
        }
        missingKeysByFile[filePath].push({ key, line: lineNum, context: lines[lineNum-1].trim() });
      }
    }
  });

  const totalMissing = Object.values(missingKeysByFile).reduce((acc, curr) => acc + curr.length, 0);

  if (totalMissing === 0) {
    console.log(`\n${COLORS.bright}${COLORS.green}✨ Все ключи на месте!${COLORS.reset}`);
  } else {
    console.log(`\n${COLORS.bright}${COLORS.red}❌ Найдено отсутствующих ключей: ${totalMissing}${COLORS.reset}`);
    Object.entries(missingKeysByFile).forEach(([file, items]) => {
      console.log(`\n${COLORS.bright}${path.relative(frontendRoot, file)}:${COLORS.reset}`);
      items.forEach(item => {
        console.log(`  L${item.line}: [${COLORS.yellow}${item.key}${COLORS.reset}] -> ${item.context}`);
      });
    });
    process.exitCode = 1;
  }

  if (dynamicKeys.length > 0) {
    console.log(`\n${COLORS.bright}${COLORS.yellow}ℹ️ Пропущено динамических ключей (проверьте вручную):${COLORS.reset}`);
    dynamicKeys.forEach(d => {
      console.log(`  - [${COLORS.cyan}${d.key}${COLORS.reset}] в файле ${path.relative(frontendRoot, d.file)}`);
    });
  }
}

run();
