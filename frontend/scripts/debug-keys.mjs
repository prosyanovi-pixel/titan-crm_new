import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const frontendRoot = path.resolve(__dirname, '..');
const I18N_ROOT = 'src/lib/i18n/locales/ru';
const i18nPath = path.join(frontendRoot, I18N_ROOT);

function resolvePath(importPath, currentFileDir) {
  let resolvedPath = importPath;
  if (importPath.startsWith('@/')) {
    resolvedPath = path.join(frontendRoot, 'src', importPath.replace('@/', ''));
  } else if (importPath.startsWith('./') || importPath.startsWith('../')) {
    resolvedPath = path.resolve(currentFileDir, importPath);
  } else return null;
  const exts = ['', '.ts', '.tsx', '/index.ts', '/index.tsx'];
  for (const ext of exts) {
    if (fs.existsSync(resolvedPath + ext) && !fs.statSync(resolvedPath + ext).isDirectory()) return resolvedPath + ext;
  }
  if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
    if (fs.existsSync(path.join(resolvedPath, 'index.ts'))) return path.join(resolvedPath, 'index.ts');
    if (fs.existsSync(path.join(resolvedPath, 'index.tsx'))) return path.join(resolvedPath, 'index.tsx');
  }
  return null;
}

function buildImportMap(content, filePath) {
  const imports = {};
  const defaultImportRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = defaultImportRegex.exec(content)) !== null) {
    imports[match[1]] = { sourcePath: resolvePath(match[2], path.dirname(filePath)), exportName: 'default' };
  }
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
  return imports;
}

function extractAllKeys(content, prefix, exportNameFilter, filePath, imports) {
  const keys = {};
  imports = imports || {};
  const cleanContent = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
  const constRegex = /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*/g;
  let match;
  while ((match = constRegex.exec(cleanContent)) !== null) {
    const varName = match[1];
    const restStart = constRegex.lastIndex;
    const rest = cleanContent.slice(restStart).trimStart();
    if (exportNameFilter && varName !== exportNameFilter) continue;
    if (rest.startsWith('{')) {
      let newPrefix = prefix;
      const CONTAINER_MODULES = ['business', 'legal', 'office', 'layout'];
      if (!CONTAINER_MODULES.includes(varName) && varName !== 'default') {
        const isRedundant = prefix === varName || prefix.endsWith('.' + varName) || (exportNameFilter && varName === exportNameFilter);
        if (!isRedundant) newPrefix = prefix ? `${prefix}.${varName}` : varName;
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
      const aliasMatch = rest.match(/^([\w.]+)/);
      if (aliasMatch) {
        const sourcePath = aliasMatch[1].split('.');
        const sourceVar = sourcePath[0];
        const importInfo = imports[sourceVar];
        if (importInfo && importInfo.sourcePath) {
          const subExportName = sourcePath.length > 0 ? sourcePath[sourcePath.length - 1] : importInfo.exportName || sourceVar;
          const isSameName = varName === subExportName;
          const nextPrefix = isSameName ? prefix : (prefix ? `${prefix}.${varName}` : varName);
          Object.assign(keys, processI18nFile(importInfo.sourcePath, nextPrefix, subExportName, true));
        }
      }
    }
  }
  if (!exportNameFilter) {
    Object.assign(keys, extractAllKeysInternal(cleanContent, prefix, imports, filePath));
  }
  return keys;
}

function extractAllKeysInternal(content, prefix, imports, filePath) {
  imports = imports || {};
  const keys = {};
  const propRegex = /(['"]?)([\w\-\/]+)\1\s*:\s*(\{?)/g;
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
      const wordMatch = trimmedValue.match(/^([\w.]+)$/);
      if (wordMatch) {
        const valName = wordMatch[1].split('.')[0];
        const importInfo = imports[valName];
        if (importInfo && importInfo.sourcePath) {
          const subExportName = imports[valName].exportName || valName;
          Object.assign(keys, processI18nFile(importInfo.sourcePath, newPrefix, subExportName, true));
          continue;
        }
      }
      keys[newPrefix] = true;
    }
  }
  const shorthandRegex = /(\w+)(?=\s*[,}]\s*)/g;
  let shorthandMatch;
  while ((shorthandMatch = shorthandRegex.exec(content)) !== null) {
    const name = shorthandMatch[1];
    if (processedKeys.has(name)) continue;
    if (['true','false','null','undefined','void','typeof','const','let','var','import','export','return','if','else','for','while','function','class','new','this','throw','try','catch','finally','case','break','default','switch','continue','yield','async','await','from','as','of','in'].includes(name)) continue;
    const newPrefix = prefix ? `${prefix}.${name}` : name;
    const importInfo = imports[name];
    if (importInfo && importInfo.sourcePath) {
      Object.assign(keys, processI18nFile(importInfo.sourcePath, newPrefix, importInfo.exportName || name, true));
    } else {
      keys[newPrefix] = true;
    }
  }
  const spreadRegex = /\.\.\.(\w+)/g;
  let spreadMatch;
  while ((spreadMatch = spreadRegex.exec(content)) !== null) {
    const name = spreadMatch[1];
    const importInfo = imports[name];
    if (importInfo && importInfo.sourcePath) {
      Object.assign(keys, processI18nFile(importInfo.sourcePath, prefix, importInfo.exportName || name, true));
    }
  }
  return keys;
}

const visitedFiles = new Set();
const definedKeys = {};

function processI18nFile(filePath, prefix, limitToExport, returnKeys) {
  const cacheKey = `${filePath}::${prefix}::${limitToExport}`;
  if (visitedFiles.has(cacheKey)) return {};
  visitedFiles.add(cacheKey);
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const cleanContent = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
  const keys = {};
  const imports = buildImportMap(content, filePath);
  Object.assign(keys, extractAllKeys(content, prefix, limitToExport, filePath, imports));
  
  const starMatches = content.matchAll(/export\s+\*\s+from\s+['"]([^'"]+)['"]/g);
  for (const match of starMatches) {
    const nextPath = resolvePath(match[1], path.dirname(filePath));
    if (nextPath) Object.assign(keys, processI18nFile(nextPath, prefix));
  }
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
        const CONTAINER_MODULES = ['business', 'legal', 'office', 'layout'];
        const isRedundant = prefix === exportName || prefix.endsWith('.' + exportName);
        const nextPrefix = (CONTAINER_MODULES.includes(exportName) || isRedundant) ? prefix : (prefix ? `${prefix}.${exportName}` : exportName);
        Object.assign(keys, processI18nFile(nextPath, nextPrefix, originalName, true));
      }
    }
  }
  const defaultExportRegex = /export\s+default\s+([\w]+)/g;
  let defaultMatch;
  while ((defaultMatch = defaultExportRegex.exec(cleanContent)) !== null) {
    const name = defaultMatch[1];
    if (limitToExport === 'default' || !limitToExport) {
      Object.assign(keys, extractAllKeys(cleanContent, prefix, name, filePath, imports));
    }
  }
  if (!returnKeys) Object.assign(definedKeys, keys);
  return keys;
}

const indexFile = path.join(i18nPath, 'index.ts');
processI18nFile(indexFile);

// Add aliases
Object.keys(definedKeys).forEach(k => {
  const alias = k.startsWith('lost.') ? k.replace('lost.', 'generated.') : 
               k.startsWith('general.generated.') ? k.replace('general.generated.', 'generated.') : null;
  if (alias) definedKeys[alias] = true;
});
const modulesPrefixKeys = Object.keys(definedKeys).filter(k => k.startsWith('modules.'));
modulesPrefixKeys.forEach(k => {
  const alias = k.replace('modules.', '');
  if (!definedKeys[alias]) definedKeys[alias] = true;
});

// Now check specific keys
const checkKeys = [
  'contractors.enrichment.error_search',
  'contractors.messages.updated_fields',
  'contractors.enrichment.error_apply',
  'contractors.messages.call',
  'profile.notifications.email.title',
  'profile.personal.full_name',
  'profile.security.title',
  'profile.toast.success_update',
  'business.confirm.delete_task',
  'business.validation.title_required',
  'projects.stages.task_status.To Do',
  'projects.stages.task_status.In Progress',
];
console.log('Checking specific keys in dictionary:');
checkKeys.forEach(k => {
  console.log(`  ${k}: ${definedKeys[k] ? 'EXISTS' : 'MISSING'}`);
});
console.log(`\nTotal keys in dictionary: ${Object.keys(definedKeys).length}`);
