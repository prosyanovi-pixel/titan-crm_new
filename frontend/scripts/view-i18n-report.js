#!/usr/bin/env node

/**
 * Утилита для просмотра отчёта о недостающих i18n ключах
 * 
 * Использование:
 *   node scripts/view-i18n-report.js                    - показать краткую статистику
 *   node scripts/view-i18n-report.js --file FILE.tsx    - показать только для одного файла
 *   node scripts/view-i18n-report.js --key some.key     - найти все вхождения ключа
 *   node scripts/view-i18n-report.js --summary          - только статистика
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_ROOT = path.resolve(__dirname, '..');
const REPORT_FILE = path.join(FRONTEND_ROOT, 'missing-i18n-report.json');

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

function loadReport() {
  if (!fs.existsSync(REPORT_FILE)) {
    console.error(`${COLORS.red}❌ Отчёт не найден: ${REPORT_FILE}${COLORS.reset}`);
    console.log(`${COLORS.yellow}Сначала запустите: npm run i18n:check${COLORS.reset}`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(REPORT_FILE, 'utf-8');
  return JSON.parse(content);
}

function showSummary(report) {
  console.log(`\n${COLORS.bright}${COLORS.cyan}═`.repeat(50) + `${COLORS.reset}`);
  console.log(`${COLORS.bright}📊 Отчёт о недостающих i18n ключах${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}═`.repeat(50) + `${COLORS.reset}\n`);
  
  console.log(`📅 Создан: ${COLORS.yellow}${report.generated_at}${COLORS.reset}`);
  console.log(`❌ Пропущено ключей: ${COLORS.red}${report.total_missing_keys}${COLORS.reset}`);
  console.log(`📁 Файлов с проблемами: ${COLORS.red}${report.total_files_with_issues}${COLORS.reset}`);
  
  if (report.dynamic_keys && report.dynamic_keys.length > 0) {
    console.log(`⚠️  Динамических ключей: ${COLORS.cyan}${report.dynamic_keys.length}${COLORS.reset}`);
  }
  
  console.log(`\n${COLORS.bright}${COLORS.cyan}─`.repeat(50) + `${COLORS.reset}`);
  console.log(`${COLORS.bright}📂 Топ файлов с проблемами:${COLORS.reset}\n`);
  
  const sortedFiles = Object.entries(report.missing_keys_by_file)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);
  
  sortedFiles.forEach(([file, issues], idx) => {
    const relativePath = path.relative(FRONTEND_ROOT, file);
    console.log(`  ${COLORS.green}${idx + 1}.${COLORS.reset} ${relativePath}`);
    console.log(`     ${COLORS.gray}${issues.length} ключей${COLORS.reset}`);
  });
  
  console.log(`\n${COLORS.bright}${COLORS.cyan}═`.repeat(50) + `${COLORS.reset}\n`);
}

function showFileDetails(report, filePath) {
  const files = Object.keys(report.missing_keys_by_file);
  const matchingFile = files.find(f => f.includes(filePath) || path.relative(FRONTEND_ROOT, f).includes(filePath));
  
  if (!matchingFile) {
    console.error(`${COLORS.red}❌ Файл не найден в отчёте${COLORS.reset}`);
    process.exit(1);
  }
  
  const issues = report.missing_keys_by_file[matchingFile];
  
  console.log(`\n${COLORS.bright}${COLORS.cyan}═`.repeat(50) + `${COLORS.reset}`);
  console.log(`${COLORS.bright}📄 ${path.relative(FRONTEND_ROOT, matchingFile)}${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}═`.repeat(50) + `${COLORS.reset}\n`);
  
  issues.forEach((issue, idx) => {
    console.log(`  ${COLORS.yellow}L${issue.line}${COLORS.reset} [${COLORS.red}${issue.key}${COLORS.reset}]`);
    console.log(`     ${COLORS.gray}${issue.context}${COLORS.reset}\n`);
  });
  
  console.log(`${COLORS.bright}${COLORS.cyan}═`.repeat(50) + `${COLORS.reset}\n`);
}
  
function searchByKey(report, key) {
  const results = [];
  
  Object.entries(report.missing_keys_by_file).forEach(([file, issues]) => {
    const matching = issues.filter(i => i.key === key);
    if (matching.length > 0) {
      results.push({ file, issues: matching });
    }
  });
  
  if (results.length === 0) {
    console.log(`${COLORS.green}✅ Ключ "${key}" не найден в отчёте (возможно, добавлен)${COLORS.reset}`);
    return;
  }
  
  console.log(`\n${COLORS.bright}${COLORS.cyan}═`.repeat(50) + `${COLORS.reset}`);
  console.log(`${COLORS.bright}🔍 Ключ: ${COLORS.red}${key}${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}═`.repeat(50) + `${COLORS.reset}\n`);
  
  results.forEach(({ file, issues }) => {
    console.log(`  ${COLORS.green}📁${COLORS.reset} ${path.relative(FRONTEND_ROOT, file)}`);
    issues.forEach(issue => {
      console.log(`     ${COLORS.yellow}L${issue.line}${COLORS.reset}`);
    });
  });
  
  console.log(`\n  ${COLORS.cyan}Всего вхождений: ${results.reduce((acc, r) => acc + r.issues.length, 0)}${COLORS.reset}\n`);
}

function listAllFiles(report) {
  console.log(`\n${COLORS.bright}${COLORS.cyan}═`.repeat(50) + `${COLORS.reset}`);
  console.log(`${COLORS.bright}📂 Все файлы с проблемами${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}═`.repeat(50) + `${COLORS.reset}\n`);
  
  const sortedFiles = Object.entries(report.missing_keys_by_file)
    .sort((a, b) => a[0].localeCompare(b[0]));
  
  sortedFiles.forEach(([file, issues]) => {
    const relativePath = path.relative(FRONTEND_ROOT, file);
    const uniqueKeys = new Set(issues.map(i => i.key)).size;
    console.log(`  ${COLORS.green}📄${COLORS.reset} ${relativePath}`);
    console.log(`     ${COLORS.gray}${issues.length} ссылок, ${uniqueKeys} уникальных ключей${COLORS.reset}`);
  });
  
  console.log(`\n${COLORS.bright}${COLORS.cyan}═`.repeat(50) + `${COLORS.reset}\n`);
}

// Parse arguments
const args = process.argv.slice(2);
const report = loadReport();

if (args.includes('--summary') || args.length === 0) {
  showSummary(report);
} else if (args.includes('--file')) {
  const fileIndex = args.indexOf('--file');
  const filePath = args[fileIndex + 1];
  if (!filePath) {
    console.error(`${COLORS.red}❌ Укажите путь к файлу${COLORS.reset}`);
    process.exit(1);
  }
  showFileDetails(report, filePath);
} else if (args.includes('--key')) {
  const keyIndex = args.indexOf('--key');
  const key = args[keyIndex + 1];
  if (!key) {
    console.error(`${COLORS.red}❌ Укажите ключ${COLORS.reset}`);
    process.exit(1);
  }
  searchByKey(report, key);
} else if (args.includes('--list')) {
  listAllFiles(report);
} else {
  console.log(`${COLORS.bright}Использование:${COLORS.reset}`);
  console.log(`  node scripts/view-i18n-report.js                    - краткая статистика`);
  console.log(`  node scripts/view-i18n-report.js --file FILE.tsx    - детали по файлу`);
  console.log(`  node scripts/view-i18n-report.js --key some.key     - поиск по ключу`);
  console.log(`  node scripts/view-i18n-report.js --list             - список всех файлов`);
  console.log(`  node scripts/view-i18n-report.js --summary          - только статистика`);
  console.log(`\n${COLORS.yellow}Пример:${COLORS.reset}`);
  console.log(`  node scripts/view-i18n-report.js --file components/Button.tsx`);
  console.log(`  node scripts/view-i18n-report.js --key generated.save_button\n`);
}
