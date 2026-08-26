/**
 * Скрипт проверки на хардкоженный русский текст в коде
 * Исключает: комментарии, i18n/locales директории
 * 
 * Использование: node test/check-russian-text.js [путь]
 */

const fs = require('fs');
const path = require('path');

function removeComments(line) {
  let code = line.replace(/\/\/.*$/, '');
  return code;
}

function hasHardcodedRussian(line) {
  const match = line.match(/(['"])\s*[\u0400-\u04FF]/);
  return match !== null;
}

function isCommentLine(line) {
  const trimmed = line.trim();
  return trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*');
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const violations = [];
  
  let inMultilineComment = false;
  
  lines.forEach((line, idx) => {
    if (line.includes('/*')) inMultilineComment = true;
    if (inMultilineComment) {
      if (line.includes('*/')) inMultilineComment = false;
      return;
    }
    
    if (isCommentLine(line)) return;
    
    const codeOnly = line.replace(/\/\/.*$/, '');
    
    if (hasHardcodedRussian(codeOnly)) {
      violations.push({ line: idx + 1, content: line.trim().substring(0, 120) });
    }
  });
  
  return violations;
}

function walkDir(dir, extensions, excludeDirs = []) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (excludeDirs.includes(file)) return;
      results = results.concat(walkDir(filePath, extensions, excludeDirs));
    } else if (extensions.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  });
  
  return results;
}

// Main
const rootDir = process.argv[2] || 'frontend/src';
const extensions = ['.ts', '.tsx', '.js', '.jsx'];
const excludeDirs = ['node_modules', 'i18n', 'locales'];

console.log('🔍 Поиск хардкоженного русского текста (исключая комментарии и i18n/locales)...\n');

const files = walkDir(rootDir, extensions, excludeDirs);
let totalViolations = 0;
const filesWithViolations = [];

files.forEach(file => {
  const violations = checkFile(file);
  if (violations.length > 0) {
    filesWithViolations.push({ file, violations });
    totalViolations += violations.length;
  }
});

// Вывод результатов
filesWithViolations.forEach(({ file, violations }) => {
  console.log(`\n📁 ${file}`);
  violations.forEach(v => {
    console.log(`   ${v.line}: ${v.content}`);
  });
});

console.log(`\n${'='.repeat(60)}`);
console.log(`ВСЕГО НАЙДЕНО: ${totalViolations} строк с хардкоженным русским текстом`);
console.log(`ФАЙЛОВ С НАРУШЕНИЯМИ: ${filesWithViolations.length}`);

// Exit code для CI/CD
if (totalViolations > 0) {
  process.exit(1);
}
