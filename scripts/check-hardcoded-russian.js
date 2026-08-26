/**
 * Скрипт проверки на наличие хардкоженного русского текста в модулях
 * 
 * Использование:
 *   node test/check-hardcoded-russian.js
 * 
 * Проверяет файлы в frontend/src/modules/, исключая папки i18n
 */

const fs = require('fs');
const path = require('path');

// Паттерн для поиска русского текста в строковых литералах
const RUSSIAN_TEXT_PATTERN = /['"`][^'"`]*[\u0400-\u04FF][^'"`]*['"`]/g;

// Паттерны-исключения (технические строки)
const EXCLUDE_PATTERNS = [
  /['"`][^'"`]*[\u0400-\u04FF][^'"`]*['"`]\s*:/, // Ключи объектов
  /import\s+.*\s+from\s+['"`].*['"`]/, // Импорты
  /\/\/.*[\u0400-\u04FF]/, // Комментарии
  /\/\*.*[\u0400-\u04FF].*\*\//, // Блочные комментарии
  /console\.(log|error|warn|info|debug)/, // Логи
  /placeholder\s*=\s*['"`][^'"`]*[\u0400-\u04FF]/, // Placeholder с русским текстом (допустимо для примеров)
  /\$\{.*\}/, // Template literals с подстановкой значений
  /`[^`]*\$\{[^}]*\}[^`]*`/, // Шаблонные строки с переменными
  /label:\s*['"`][^'"`]*[\u0400-\u04FF]/, // label в объектах (для таблиц, форм)
  /value:\s*['"`][^'"`]*[\u0400-\u04FF]/, // value в объектах
];

const MODULES_DIR = path.join(__dirname, '..', 'frontend', 'src', 'modules');

/**
 * Проверка, является ли файл файлом переводов
 */
function isI18nFile(filePath) {
  return filePath.includes('/i18n/') || filePath.includes('\\i18n\\');
}

/**
 * Проверка, является ли строка комментарием или console.log
 */
function isCommentOrConsoleLine(line) {
  const trimmed = line.trim();
  // Пропускаем комментарии
  if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
    return true;
  }
  // Пропускаем console.log, console.error, console.warn, console.info
  if (/console\.(log|error|warn|info|debug)\s*\(/.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * Поиск хардкоженного русского текста в файле
 */
function findHardcodedRussian(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];

  lines.forEach((line, index) => {
    // Пропускаем комментарии и console.log
    if (isCommentOrConsoleLine(line)) {
      return;
    }

    const matches = line.match(RUSSIAN_TEXT_PATTERN);
    if (matches) {
      // Проверяем исключения
      const hasExclusion = EXCLUDE_PATTERNS.some(pattern => pattern.test(line));
      if (!hasExclusion) {
        issues.push({
          line: index + 1,
          content: line.trim(),
          matches: matches
        });
      }
    }
  });

  return issues;
}

/**
 * Рекурсивный обход директории
 */
function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (/\.(ts|tsx)$/.test(file)) {
      callback(filePath);
    }
  });
}

/**
 * Основная функция проверки
 */
function checkHardcodedRussian() {
  console.log('=== Проверка на хардкоженный русский текст в модулях ===\n');

  const allIssues = [];
  let totalFiles = 0;
  let checkedFiles = 0;

  // Собираем все .ts и .tsx файлы
  walkDir(MODULES_DIR, (filePath) => {
    totalFiles++;
    
    // Пропускаем файлы i18n
    if (isI18nFile(filePath)) {
      return;
    }

    checkedFiles++;
    const issues = findHardcodedRussian(filePath);
    
    if (issues.length > 0) {
      allIssues.push({
        file: path.relative(process.cwd(), filePath),
        issues
      });
    }
  });

  // Вывод результатов
  if (allIssues.length === 0) {
    console.log('✅ Хардкоженный русский текст не найден!');
    console.log(`\nПроверено файлов: ${checkedFiles}`);
    process.exit(0);
  }

  console.log(`❌ Найден хардкоженный русский текст в ${allIssues.length} файлах:\n`);
  
  let totalIssues = 0;
  allIssues.forEach(({ file, issues }) => {
    console.log(`\n📁 ${file}`);
    issues.forEach(({ line, content }) => {
      console.log(`   Строка ${line}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`);
      totalIssues++;
    });
  });

  console.log('\n' + '='.repeat(60));
  console.log(`Итого: ${totalIssues} строк с харкоженным русским текстом`);
  console.log(`Проверено файлов: ${checkedFiles} из ${totalFiles}`);
  console.log('\n=== Рекомендуется вынести текст в файлы переводов ===');
  console.log('Путь для переводов: frontend/src/modules/<module>/i18n/ru/index.ts\n');

  process.exit(1);
}

// Запуск проверки
checkHardcodedRussian();
