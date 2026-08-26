#!/usr/bin/env node
/**
 * Скрипт генерирует report.txt с полными путями к файлам и количеством строк в каждом.
 * Учитывает правила из .gitignore.
 */

const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const gitignorePath = path.join(rootDir, '.gitignore');
const reportPath = path.join(rootDir, 'report.txt');

// Расширения файлов для анализа
const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.js']);

/**
 * Загружает паттерны из .gitignore
 */
function loadGitignorePatterns(gitignorePath) {
    const patterns = [];
    
    if (!fs.existsSync(gitignorePath)) {
        return patterns;
    }
    
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    
    for (const line of content.split('\n')) {
        const trimmed = line.trim();
        // Пропускаем пустые строки, комментарии и инвертированные паттерны
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) {
            continue;
        }
        patterns.push(trimmed);
    }
    
    return patterns;
}

/**
 * Проверяет, должен ли путь быть проигнорирован по паттерну
 */
function matchesPattern(filePath, pattern, rootDir) {
    const relPath = path.relative(rootDir, filePath);
    const relPathForward = relPath.replace(/\\/g, '/');
    const fileName = path.basename(filePath);
    
    // Паттерны с / работают относительно корня
    if (pattern.includes('/')) {
        const normalizedPattern = pattern.replace(/^\//, '');
        
        // Проверка полного относительного пути
        if (minimatch(relPathForward, normalizedPattern)) {
            return true;
        }
        if (minimatch(relPathForward, '**/' + normalizedPattern)) {
            return true;
        }
    }
    
    // Простые паттерны (без /) проверяем для имени файла
    if (!pattern.includes('/')) {
        if (minimatch(fileName, pattern)) {
            return true;
        }
        // Проверка на расширение (*.log)
        if (pattern.startsWith('*.')) {
            const ext = pattern.slice(1);
            if (fileName.endsWith(ext)) {
                return true;
            }
        }
    }
    
    // Паттерны с ** для рекурсивного поиска
    if (pattern.startsWith('**/')) {
        const subPattern = pattern.slice(3);
        if (minimatch(fileName, subPattern)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Простая реализация minimatch для базовых glob-паттернов
 */
function minimatch(str, pattern) {
    // Преобразуем glob-паттерн в RegExp
    const regexPattern = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')  // Экранируем спецсимволы
        .replace(/\*\*/g, '§§')  // Временно заменяем **
        .replace(/\*/g, '[^/\\\\]*')  // * -> любые символы кроме /
        .replace(/§§/g, '.*')  // ** -> любые символы включая /
        .replace(/\?/g, '.');  // ? -> один любой символ
    
    const regex = new RegExp('^' + regexPattern + '$');
    return regex.test(str);
}

/**
 * Проверяет, должен ли файл быть проигнорирован
 */
function shouldIgnore(filePath, patterns, rootDir) {
    const relPath = path.relative(rootDir, filePath);
    const relPathParts = relPath.split(path.sep);
    
    for (const pattern of patterns) {
        if (matchesPattern(filePath, pattern, rootDir)) {
            return true;
        }
        
        // Проверяем каждую часть пути для простых паттернов
        if (!pattern.includes('/')) {
            for (const part of relPathParts) {
                if (minimatch(part, pattern)) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

/**
 * Подсчитывает количество строк в файле
 */
function countLines(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.length === 0) {
            return 0;
        }
        return content.split('\n').length;
    } catch (err) {
        return 0;
    }
}

/**
 * Проверяет, является ли файл текстовым
 */
function isTextFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return TEXT_EXTENSIONS.has(ext);
}

/**
 * Сканирует директорию и возвращает список файлов с количеством строк
 */
function scanDirectory(rootDir, patterns) {
    const results = [];
    
    function walkDir(dir) {
        let entries;
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch (err) {
            return;
        }
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            // Пропускаем скрытые файлы и директории
            if (entry.name.startsWith('.')) {
                continue;
            }
            
            if (entry.isDirectory()) {
                // Исключаем игнорируемые и стандартные директории
                if (shouldIgnore(fullPath, patterns, rootDir)) {
                    continue;
                }
                
                // Пропускаем node_modules, __pycache__, .venv и т.д.
                const skipDirs = ['node_modules', '__pycache__', 'venv', '.venv'];
                if (skipDirs.includes(entry.name)) {
                    continue;
                }
                
                walkDir(fullPath);
            } else if (entry.isFile()) {
                // Пропускаем игнорируемые файлы
                if (shouldIgnore(fullPath, patterns, rootDir)) {
                    continue;
                }
                
                // Проверяем, текстовый ли файл
                if (!isTextFile(fullPath)) {
                    continue;
                }
                
                const lines = countLines(fullPath);
                results.push({ path: fullPath, lines });
            }
        }
    }
    
    walkDir(rootDir);
    return results;
}

/**
 * Основная функция
 */
function main() {
    console.log(`Загрузка паттернов из ${gitignorePath}...`);
    const patterns = loadGitignorePatterns(gitignorePath);
    console.log(`Найдено паттернов: ${patterns.length}`);
    
    console.log('Сканирование файлов...');
    const results = scanDirectory(rootDir, patterns);
    
    // Сортируем по пути
    results.sort((a, b) => a.path.localeCompare(b.path));
    
    console.log(`Найдено файлов: ${results.length}`);
    console.log(`Запись отчета в ${reportPath}...`);
    
    let totalLines = 0;
    const reportLines = [
        'Отчет по файлам проекта',
        `Корневая директория: ${rootDir}`,
        `Всего файлов: ${results.length}`,
        '='.repeat(80),
        ''
    ];
    
    for (const { path: filePath, lines } of results) {
        const relativePath = path.relative(rootDir, filePath);
        reportLines.push(`${relativePath}: ${lines} строк(и)`);
        totalLines += lines;
    }
    
    reportLines.push('');
    reportLines.push('='.repeat(80));
    reportLines.push(`Общее количество строк: ${totalLines}`);
    
    fs.writeFileSync(reportPath, reportLines.join('\n'), 'utf-8');
    
    console.log(`Готово! Отчет сохранен в ${reportPath}`);
    console.log(`Общее количество строк: ${totalLines}`);
}

main();
