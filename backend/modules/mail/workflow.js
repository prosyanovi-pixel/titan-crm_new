/**
 * Workflow Actions для модуля Mail (расширенная версия)
 */

const db = require('../../db');
const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');
const { getOrCreateFolder } = require('../documents/utils/helpers');
const mailHelpers = require('./utils/helpers');
const { getModuleSettings } = require('../../utils/moduleSettingsLoader');

/**
 * Получить путь к папке для сохранения файлов воркфлоу
 */
async function getWorkflowStorageInfo() {
  const settings = await getModuleSettings('workflows');
  const relPathFromBackend = settings.defaults?.attachmentsDir || 'uploads/documents/workflow';
  
  // Определяем относительный путь для БД (относительно uploads/documents)
  // Это нужно, чтобы модуль документов мог найти файл
  const baseDocsDir = 'uploads/documents';
  let relPathForDB = '';
  if (relPathFromBackend.startsWith(baseDocsDir)) {
    relPathForDB = relPathFromBackend.substring(baseDocsDir.length).replace(/^[/\\]+/, '');
    if (relPathForDB && !relPathForDB.endsWith('/')) relPathForDB += '/';
  }

  const absPath = path.join(__dirname, '../../', relPathFromBackend);
  if (!fs.existsSync(absPath)) {
    fs.mkdirSync(absPath, { recursive: true });
  }
  return { absPath, relPathForDB };
}

/** Helper: download a file from URL and save to uploads, return stored filename */
async function downloadFileFromUrl(url) {
  const { absPath, relPathForDB } = await getWorkflowStorageInfo();
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const ext   = path.extname(new URL(url).pathname) || '.file';
    const uuid  = uuidv4();
    const storedFilename = `${relPathForDB}${uuid}${ext}`;
    const filePath = path.join(absPath, `${uuid}${ext}`);
    const file = fs.createWriteStream(filePath);

    proto.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlink(filePath, () => {});
        return downloadFileFromUrl(response.headers.location).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`HTTP ${response.statusCode} downloading ${url}`));
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve({ storedFilename, filePath }); });
      file.on('error', reject);
    }).on('error', reject);
  });
}

/** Helper: extract URLs from plain text */
function extractUrlsFromText(text) {
  if (!text) return [];
  const urlRegex = /https?:\/\/[^\s"'<>()]+/g;
  return [...new Set(text.match(urlRegex) || [])];
}

module.exports = {
  actions: {

    // ─────────── Базовые действия ───────────

    fetch_emails: {
      label: 'Получить последние письма',
      isReadOnly: true,
      inputSchema: {
        properties: {
          account_id:  { type: 'account', label: 'Почтовый аккаунт' },
          folder:      { type: 'string',  label: 'Папка (INBOX)',            default: 'INBOX' },
          limit:       { type: 'number',  label: 'Кол-во писем для обработки', default: 10 },
          unread_only: { type: 'boolean', label: 'Только непрочитанные',     default: true },
          process_each_email: { type: 'boolean', label: 'Обрабатывать каждое письмо отдельно', default: true },
          subject_contains: { type: 'string', label: 'Тема содержит',        default: '' },
          sender_contains:  { type: 'string', label: 'Отправитель содержит', default: '' },
        }
      },
      handler: async (config, context, logger) => {
        const {
          account_id,
          folder = 'INBOX',
          limit = 10,
          unread_only = true,
          subject_contains = '',
          sender_contains = ''
        } = config;
        const parsedLimit = parseInt(limit);
        logger?.info(`Fetching emails from folder "${folder}" (unread only: ${unread_only}, limit: ${parsedLimit})`);
        
        let folderIds = [];
        if (folder && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(folder)) {
          folderIds = [folder];
        } else if (folder) {
          let fQuery = 'SELECT id FROM mail_folders WHERE folder_name = $1';
          const fParams = [folder];
          if (account_id) {
            fQuery += ' AND account_id = $2';
            fParams.push(account_id);
          }
          const { rows: fRows } = await db.query(fQuery, fParams);
          folderIds = fRows.map(r => r.id);
        }

        if (folder && folderIds.length === 0) {
           logger?.warn(`Folder "${folder}" not found.`);
           return { emails: [], count: 0, total_matching: 0, has_more: false, is_complete: true };
        }

        // ШАГ 1: Сначала проверяем СКОЛЬКО писем соответствуют критериям (без лимита)
        let countQuery = `SELECT COUNT(*) as total FROM mail WHERE 1=1`;
        const countParams = [];
        
        if (folderIds.length > 0) {
          countQuery += ` AND folder_id = ANY($${countParams.length + 1})`;
          countParams.push(folderIds);
        }
        
        if (unread_only) countQuery += ' AND read = false';
        if (account_id) {
          countQuery += ` AND account_id = $${countParams.length + 1}`;
          countParams.push(account_id);
        }
        if (subject_contains) {
          countQuery += ` AND subject ILIKE $${countParams.length + 1}`;
          countParams.push(`%${subject_contains}%`);
        }
        if (sender_contains) {
          countQuery += ` AND (sender ILIKE $${countParams.length + 1} OR senderemail ILIKE $${countParams.length + 2})`;
          countParams.push(`%${sender_contains}%`, `%${sender_contains}%`);
        }
        
        const { rows: countRows } = await db.query(countQuery, countParams);
        const totalMatching = parseInt(countRows[0]?.total || 0);
        
        // ШАГ 2: Получаем письма с лимитом (сортируем по дате, новые первыми)
        let query = `SELECT id, subject, sender, content as body_text, html_content as html_body, date as received_at, read as is_read, folder_id 
                     FROM mail 
                     WHERE 1=1`;
        const params = [];

        if (folderIds.length > 0) {
          query += ` AND folder_id = ANY($${params.length + 1})`;
          params.push(folderIds);
        }
        
        if (unread_only) query += ' AND read = false';
        if (account_id) {
          query += ` AND account_id = $${params.length + 1}`;
          params.push(account_id);
        }
        if (subject_contains) {
          query += ` AND subject ILIKE $${params.length + 1}`;
          params.push(`%${subject_contains}%`);
        }
        if (sender_contains) {
          query += ` AND (sender ILIKE $${params.length + 1} OR senderemail ILIKE $${params.length + 2})`;
          params.push(`%${sender_contains}%`, `%${sender_contains}%`);
        }
        
        // Сортировка: новые письма первыми (новые и прочитанные могут быть перемешаны)
        query += ` ORDER BY date DESC LIMIT $${params.length + 1}`;
        params.push(parsedLimit);

        const { rows } = await db.query(query, params);
        
        // Шаг 3: Определяем есть ли еще писем для обработки
        const hasMore = totalMatching > rows.length;
        const isComplete = rows.length < parsedLimit; // Если получили меньше лимита, то всё обработано
        
        logger?.info(`Found ${rows.length}/${totalMatching} emails matching criteria. Has more: ${hasMore}, Complete: ${isComplete}`);
        
        return { 
          emails: rows, 
          count: rows.length,
          total_matching: totalMatching,  // Всего писем соответствующих критериям
          limit: parsedLimit,              // Установленный лимит
          has_more: hasMore,               // Есть ли еще писем которые нужно обработать
          is_complete: isComplete,         // Обработаны ли все письма (получено < лимита)
          // Разбиение по статусу прочтения (для информации)
          unread_count: unread_only ? rows.length : rows.filter(r => !r.isRead).length,
          read_count: unread_only ? 0 : rows.filter(r => r.isRead).length
        };
      }
    },

    search_by_subject: {
      label: 'Найти письма по теме',
      inputSchema: {
        properties: {
          account_id: { type: 'account', label: 'Почтовый аккаунт' },
          keyword:    { type: 'string',  label: 'Ключевое слово в теме' },
          folder:     { type: 'string',  label: 'Папка',                 default: 'INBOX' },
          limit:      { type: 'number',  label: 'Максимум результатов',   default: 5 },
        }
      },
      handler: async (config, context) => {
        const { account_id, keyword, folder = 'INBOX', limit = 5 } = config;
        
        let folderId = folder;
        if (folder && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(folder)) {
          const { rows: fRows } = await db.query('SELECT id FROM mail_folders WHERE folder_name = $1 LIMIT 1', [folder]);
          if (fRows.length > 0) folderId = fRows[0].id;
        }

        let query = `SELECT id, subject, sender, content as body_text, date as received_at 
                     FROM mail 
                     WHERE folder_id = $1 AND subject ILIKE $2`;
        const params = [folderId, `%${keyword}%`];
        
        if (account_id) {
          query += ` AND account_id = $${params.length + 1}`;
          params.push(account_id);
        }
        
        query += ` ORDER BY date DESC LIMIT $${params.length + 1}`;
        params.push(parseInt(limit));

        const { rows } = await db.query(query, params);
        return { emails: rows, count: rows.length };
      }
    },

    // ─────────── Продвинутые действия ───────────

    search_by_sender: {
      label: 'Найти письма от отправителя',
      isReadOnly: true,
      inputSchema: {
        properties: {
          account_id:   { type: 'account', label: 'Почтовый аккаунт' },
          sender_email: { type: 'string',  label: 'Email отправителя или часть',  placeholder: '@court.ru' },
          folder:       { type: 'string',  label: 'Папка',                        default: 'INBOX' },
          limit:        { type: 'number',  label: 'Максимум результатов',          default: 10 },
          unread_only:  { type: 'boolean', label: 'Только непрочитанные',         default: false },
        }
      },
      handler: async (config, context, logger) => {
        const { account_id, sender_email, folder = 'INBOX', limit = 10, unread_only = false } = config;
        const parsedLimit = parseInt(limit);
        logger?.info(`Searching for emails from "${sender_email}" in folder "${folder}"`);
        if (!sender_email) throw new Error('[mail.search_by_sender] sender_email обязателен');
        
        let folderId = folder;
        if (folder && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(folder)) {
          const { rows: fRows } = await db.query('SELECT id FROM mail_folders WHERE folder_name = $1 LIMIT 1', [folder]);
          if (fRows.length > 0) folderId = fRows[0].id;
        }

        // Шаг 1: Считаем СКОЛЬКО писем соответствуют критериям (без лимита)
        let countQuery = `SELECT COUNT(*) as total FROM mail WHERE folder_id = $1 AND sender ILIKE $2`;
        const countParams = [folderId, `%${sender_email}%`];
        
        if (unread_only) countQuery += ' AND read = false';
        if (account_id) {
          countQuery += ` AND account_id = $${countParams.length + 1}`;
          countParams.push(account_id);
        }
        
        const { rows: countRows } = await db.query(countQuery, countParams);
        const totalMatching = parseInt(countRows[0]?.total || 0);

        // Шаг 2: Получаем письма с лимитом
        let query = `SELECT id, subject, sender, content as body_text, html_content as html_body, date as received_at, read as is_read
                     FROM mail
                     WHERE folder_id = $1 AND sender ILIKE $2`;
        const params = [folderId, `%${sender_email}%`];

        if (unread_only) query += ' AND read = false';
        if (account_id) {
          query += ` AND account_id = $${params.length + 1}`;
          params.push(account_id);
        }

        query += ` ORDER BY date DESC LIMIT $${params.length + 1}`;
        params.push(parsedLimit);

        const { rows } = await db.query(query, params);
        
        // Шаг 3: Определяем есть ли еще писем для обработки
        const hasMore = totalMatching > rows.length;
        const isComplete = rows.length < parsedLimit;
        
        if (rows.length > 0) {
          logger?.log(`Match found: "${rows[0].subject}" from ${rows[0].sender}`);
        } else {
          logger?.log('No emails found matching the sender criteria');
        }
        
        return { 
          emails: rows, 
          count: rows.length,
          total_matching: totalMatching,  // Всего писем соответствующих критериям
          limit: parsedLimit,              // Установленный лимит
          has_more: hasMore,               // Есть ли еще писем для обработки
          is_complete: isComplete,         // Обработаны ли все письма
          found: rows.length > 0,
          unread_count: unread_only ? rows.length : rows.filter(r => !r.isRead).length,
          read_count: unread_only ? 0 : rows.filter(r => r.isRead).length
        };
      }
    },

    extract_arbitr_data: {
      label: 'Извлечь данные из письма Арбитр (гвардия)',
      isReadOnly: true,
      inputSchema: {
        properties: {
          html_body:  { type: 'string', label: 'HTML тело письма', placeholder: 'HTML письма (из шага получения писем)' },
          body_text:  { type: 'string', label: 'Текстовое тело письма (резервное)', placeholder: 'Текст письма (из шага получения писем)' },
          keyword:    { type: 'string', label: 'Ключевое слово (фильтр)', default: 'ВМТ' },
        }
      },
      outputSchema: {
        properties: {
          updates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                caseNumber: { type: 'string' },
                cardUrl: { type: 'string' },
                instanceType: { type: 'string' },
                docInfo: { type: 'string' },
                judge: { type: 'string' },
                pubDate: { type: 'string' },
                formattedNote: { type: 'string' },
                pdfUrl: { type: 'string' }
              }
            }
          }
        }
      },
      handler: async (config, context, logger) => {
        const { html_body, body_text, keyword = 'ВМТ' } = config;

        // Helper to detect instance type
        const detectInstanceType = (caseNumber) => {
          if (!caseNumber) return 'first';
          if (caseNumber.includes('АП')) return 'appeal';
          if (caseNumber.startsWith('Ф')) return 'cassation';
          if (caseNumber.startsWith('А')) return 'first';
          return 'first';
        };
        
        // Use html_body if available, fallback to body_text if html_body is empty
        let contentToProcess = html_body;
        let isPlainText = false;
        
        if (!contentToProcess || contentToProcess.trim() === '') {
          if (body_text && body_text.trim() !== '') {
            contentToProcess = body_text;
            isPlainText = true;
            logger?.log('[mail.extract_arbitr_data] html_content пустое, используется body_text');
          } else {
            throw new Error('[mail.extract_arbitr_data] Ни html_body, ни body_text не содержат данных');
          }
        }

        const $ = cheerio.load(contentToProcess);
        const updates = [];
        let totalFoundCases = 0;

        // Каждое дело обычно начинается с ссылки на карточку kad.arbitr.ru/Card/
        // Skip cheerio parsing if plain text
        if (!isPlainText) {
          $('a[href*="kad.arbitr.ru/Card"]').each((i, el) => {
            totalFoundCases++;
            const $cardLink = $(el);
            const caseNumber = $cardLink.text().trim();
            const cardUrl = $cardLink.attr('href');
            const instanceType = detectInstanceType(caseNumber);

            // Ищем контейнер этого блока (обычно это таблица или ближайший родительский блок)
            // Пытаемся найти наиболее подходящий контейнер (таблицу)
            let $container = $cardLink.closest('table');
            if ($container.length && $container.parent().closest('table').length) {
                $container = $container.parent().closest('table');
            }
            
            // Извлекаем стороны (Истец/Ответчик)
            const parties = [];
            // Ищем во всем документе или в контейнере? Лучше в ближайшем окружении
            const $context = $container.length ? $container : $('body');
            
            $context.find('img[src*="plaintiff"], img[src*="defendant"]').each((j, img) => {
              const type = $(img).attr('src').includes('plaintiff') ? 'Истец' : 'Ответчик';
              const name = $(img).closest('td').next().text().trim();
              if (name) parties.push({ type, name });
            });

            // Проверка фильтра по ключевому слову
            const searchableText = (caseNumber + ' ' + $context.text()).toLowerCase();
            const matchesKeyword = !keyword || searchableText.includes(keyword.toLowerCase());
            if (!matchesKeyword) return;
            
            // Если Cheerio нашел, но parties пустые, попробуем поискать текст ООО/АО
            if (parties.length === 0 && keyword) {
               // Добавляем виртуальную сторону если нашли по ключевому слову
               parties.push({ type: 'Участник', name: keyword });
            }

            // Извлекаем детали документа
            const $detailsTable = $container.nextAll('table').first();
            
            const instancyInfo = $detailsTable.find('b').first().parent().text().trim(); 
            const docInfo = $detailsTable.find('span[style*="color:#82ad4c"]').text().trim(); 
            const judge = $detailsTable.find('span[style*="color:#86898e"]').text().trim(); 
            
            // Попытка извлечь название суда из instancyInfo или из контекста
            let courtName = null;
            if (instancyInfo && instancyInfo.toLowerCase().includes('суд')) {
              const courtMatch = instancyInfo.match(/([А-Я][а-я]+\s+суд\s+[А-Яа-я\s-]+(?:края|области|города|республики|округа|инстанции))/i);
              courtName = courtMatch ? courtMatch[1].trim() : instancyInfo;
            }

            const $pdfLink = $detailsTable.find('a[href*="PdfDocument"]');
            let pdfUrl = $pdfLink.attr('href');
            let docName = $pdfLink.text().trim(); 

            if (!pdfUrl) {
              pdfUrl = cardUrl;
              docName = `Карточка дела ${caseNumber}`;
            }

            const pubDate = $detailsTable.find('a[href*="PublishReport"]').text().trim(); 

            const formattedNote = [
              `Дело: ${caseNumber} (${instancyInfo || 'Первая инстанция'})`,
              courtName ? `Суд: ${courtName}` : '',
              `${docInfo}`,
              `Судья: ${judge || 'Не указан'}`,
              `Документ: ${docName}`,
              `${pubDate}`,
              pdfUrl ? `Файл: ${pdfUrl}` : ''
            ].filter(Boolean).join('\n');

            updates.push({
              caseNumber,
              courtName: courtName || null,
              judge: judge || null,
              cardUrl: cardUrl || null,
              parties,
              instancyInfo: instancyInfo || null,
              instanceType,
              docInfo: docInfo || null,
              pdfUrl: pdfUrl || null,
              docName: docName || null,
              pubDate: pubDate || null,
              formattedNote: formattedNote || ''
            });
          });
        }

        // REGEX FALLBACK
        if (updates.length === 0) {
          logger?.log('Cheerio found no relevant matches, attempting improved regex for My Arbitr/Guard...');
          
          // Не сплитим, если в письме только одно упоминание дела, или если сплит ломает контекст
          let caseBlocks = contentToProcess.split(/(?=Номер дела:|Новая информация по делу)/i);
          if (caseBlocks.length <= 1) {
            caseBlocks = [contentToProcess];
          } 
          // Если первый блок не содержит номера дела, но содержит заголовок (приветствие), 
          // приклеим его к первому найденному делу для контекста
          let headerContext = "";
          if (caseBlocks.length > 1 && !caseBlocks[0].match(/[А-ЯA-Z]?\d{1,2}-\d+\/\d{4}/)) {
             headerContext = caseBlocks[0];
             caseBlocks = caseBlocks.slice(1);
          }

          for (const rawBlock of caseBlocks) {
            const block = headerContext + rawBlock;
            const caseMatch = block.match(/([А-ЯA-Z]?\d{1,2}-\d+\/\d{4})/);
            if (!caseMatch) continue;
            
            const caseNumber = caseMatch[1];
            const instanceType = detectInstanceType(caseNumber);
            
            // Check keyword (filter) - case-insensitive
            if (keyword && !block.toLowerCase().includes(keyword.toLowerCase())) continue;
            
            // Try to find Court Name: "Арбитражный суд Кировской области"
            const courtMatch = block.match(/([А-Я][а-я]+\s+суд\s+[А-Яа-я\s-]+(?:края|области|города|республики|округа))/i);
            const courtName = courtMatch ? courtMatch[1].trim() : null;

            // Try to find Judge
            const judgeMatch = block.match(/Судья[:\s]+([А-Я][а-я]+\s+[А-Я]\.\s*[А-Я]\.)/);
            const judge = judgeMatch ? judgeMatch[1].trim() : null;

            // Try to find PDF documents in My Arbitr format: "* some file.pdf, 409.99 KB"
            const pdfFiles = [];
            const pdfRegex = /\* (.*?\.pdf),\s*([\d.]+)\s*(Кб|Мб|KB|MB)/gi;
            let m;
            while ((m = pdfRegex.exec(block)) !== null) {
              pdfFiles.push({ name: m[1], size: m[2] + ' ' + m[3] });
            }

            // Find links
            let cardUrl = null;
            const cardMatch = block.match(/\[(http[^\]]*kad\.arbitr\.ru\/Card[^\]]*)\]/);
            if (cardMatch) {
              cardUrl = cardMatch[1];
            }
            
            // Find direct PDF links (if any)
            let pdfUrl = null;
            const directPdfMatch = block.match(/\[(http[^\]]+PdfDocument[^\]]+)\]/);
            if (directPdfMatch) {
              pdfUrl = directPdfMatch[1];
            } else {
              pdfUrl = cardUrl; // Fallback to card URL
            }

            const docInfoMatch = block.match(/(Постановление|Определение|Решение|Отзыв|Заявление|Ходатайство|Извещение|Уведомление|Иной документ)[^]*?от\s*\d{2}\.\d{2}\.\d{4}/i);
            let docInfo = docInfoMatch ? docInfoMatch[0].replace(/\n/g, ' ').trim() : 'Обновление в системе Арбитр';
            
            // If we found file names in text, prepend them to docInfo
            if (pdfFiles.length > 1) {
              docInfo = `${pdfFiles.map(f => f.name).join(', ')} (${docInfo})`;
            } else if (pdfFiles.length === 1) {
              docInfo = `${pdfFiles[0].name} (${docInfo})`;
            }

            const pubDateMatch = block.match(/(\d{2}\.\d{2}\.\d{4}(?:,\s*в\s*\d{2}:\d{2})?)/i);
            const pubDate = pubDateMatch ? `Дата: ${pubDateMatch[1]}` : '';

            const docName = pdfFiles.length > 0 ? pdfFiles[0].name : `Карточка дела ${caseNumber}`;
            
            const formattedNote = [
              `Дело: ${caseNumber} (${instanceType === 'appeal' ? 'Апелляция' : instanceType === 'cassation' ? 'Кассация' : 'Первая инстанция'})`,
              courtName ? `Суд: ${courtName}` : '',
              judge ? `Судья: ${judge}` : '',
              `${docInfo}`,
              pubDate,
              pdfFiles.length > 0 ? `Файлы в тексте: ${pdfFiles.map(f => f.name).join(', ')}` : '',
              pdfUrl ? `Источник: ${pdfUrl}` : ''
            ].filter(Boolean).join('\n');

            updates.push({
              caseNumber,
              courtName,
              judge,
              cardUrl,
              instanceType,
              docInfo,
              pdfUrl,
              pubDate,
              docName,
              formattedNote,
              files: pdfFiles,
              hasRealPdfLink: !!directPdfMatch,
              isRegexFallback: true
            });
          }
        }

        logger?.info(`Extracted ${updates.length} relevant case updates (filter: "${keyword}")`);
        
        return {
          found: updates.length > 0,
          updates,
          first_match: updates[0] || null,
          case_number: updates[0]?.caseNumber || null,
          instance_type: updates[0]?.instanceType || 'first',
          formatted_note: updates[0]?.formattedNote || '',
          pdf_url: updates[0]?.pdfUrl || null,
          judge: updates[0]?.judge || null
        };
      }
    },

    extract_case_number: {
      label: 'Извлечь номер судебного дела из письма',
      isReadOnly: true,
      inputSchema: {
        properties: {
          email_body: {
            type: 'string',
            label: 'Текст письма',
            placeholder: 'Текст письма (из шага получения писем)'
          },
          pattern: {
            type: 'string',
            label: 'Regex-паттерн (оставьте пустым для авто)',
            placeholder: '\\d{2}-\\d+/\\d{4}',
            description: 'По умолчанию ищет форматы: А40-12345/2024, 2-1234/2024, №12345'
          },
        }
      },
      handler: async (config, context, logger) => {
        const { email_body, pattern } = config;
        logger?.log('Attempting to extract case number from email body...');
        if (!email_body) return { found: false, case_number: null };

        // Default Russian court case patterns
        const defaultPattern = pattern ||
          '(?:дело\\s*[№#]?\\s*|дело\\s+|(?:^|\\s))([А-ЯA-Z]?\\d{1,2}-\\d+\\/\\d{4})|(?:№|#)\\s*(\\d{3,10})';

        let case_number = null;
        try {
          const re = new RegExp(defaultPattern, 'gi');
          const matches = [...email_body.matchAll(re)];
          if (matches.length > 0) {
            // Take the first non-empty capture group
            case_number = matches[0].slice(1).find(g => g && g.trim()) || null;
            logger?.info(`Extraction successful: Found case number "${case_number}"`);
          } else {
            logger?.log('No case number patterns matched in the email body');
          }
        } catch (e) {
          throw new Error(`[mail.extract_case_number] Invalid regex: ${e.message}`);
        }

        return {
          found: case_number !== null,
          case_number: case_number?.trim() || null,
        };
      }
    },

    extract_urls: {
      label: 'Извлечь URL-ссылки из письма',
      isReadOnly: true,
      inputSchema: {
        properties: {
          email_body: {
            type: 'string',
            label: 'Текст письма',
            placeholder: 'Текст письма (из шага получения писем)'
          },
          filter_ext: {
            type: 'string',
            label: 'Фильтр по расширению файла (необязательно)',
            placeholder: '.pdf, .docx',
            description: 'Через запятую: .pdf,.docx'
          },
        }
      },
      handler: async (config, context) => {
        const { email_body, filter_ext } = config;
        let urls = extractUrlsFromText(email_body);

        if (filter_ext) {
          const exts = filter_ext.split(',').map(e => e.trim().toLowerCase());
          urls = urls.filter(url => exts.some(ext => url.toLowerCase().includes(ext)));
        }

        return {
          urls,
          count: urls.length,
          found: urls.length > 0,
          first_url: urls[0] || null,
        };
      }
    },

    download_url_to_document: {
      label: 'Скачать файл по URL в Документы',
      inputSchema: {
        properties: {
          url:  { type: 'string', label: 'URL файла', placeholder: 'Ссылка на файл (из шага с URL)' },
          name: { type: 'string', label: 'Имя документа (необязательно)', placeholder: 'Документ суда' },
          folder_name: { type: 'string', label: 'Имя папки (письма)', placeholder: 'Письмо от ...' },
        }
      },
      handler: async (config, context, logger) => {
        const { url, name } = config;
        if (!url) throw new Error('[mail.download_url_to_document] url обязателен');

        try {
          const { storedFilename, filePath } = await downloadFileFromUrl(url);
          const ext  = path.extname(storedFilename);

          // Проверка на капчу (если скачался HTML вместо документа)
          // Читаем первые 500 байт файла
          const fd = fs.openSync(filePath, 'r');
          const buffer = Buffer.alloc(500);
          fs.readSync(fd, buffer, 0, 500, 0);
          fs.closeSync(fd);
          const fileContentHead = buffer.toString('utf8');

          if (fileContentHead.toLowerCase().includes('<!doctype html') || fileContentHead.toLowerCase().includes('<html')) {
            logger?.warn('[mail.download_url_to_document] Обнаружена капча или HTML страница вместо файла. Пропуск скачивания.');
            fs.unlinkSync(filePath);
            return {
              success: false,
              is_captcha: true,
              url: url,
              documentName: name || 'Документ (ссылка)'
            };
          }

          const size = fs.statSync(filePath).size;
          const docId = `doc-wf-${Date.now()}`;
          const docName = name || `Документ от ${new Date().toLocaleDateString('ru-RU')}${ext}`;
          const folderId = await getOrCreateFolder('Workflow');

          const { rows } = await db.query(
            `INSERT INTO documents (id, name, type, size, date, stored_filename, parent_id)
             VALUES ($1, $2, 'file', $3, $4, $5, $6) RETURNING *`,
            [docId, docName, size, new Date().toISOString().split('T')[0], storedFilename, folderId]
          );

          return {
            success: true,
            documentId: rows[0].id,
            documentName: rows[0].name,
            storedFilename,
            size,
            url
          };
        } catch (err) {
          logger?.error(`[mail.download_url_to_document] Error downloading: ${err.message}`);
          return {
            success: false,
            error: err.message,
            url: url,
            documentName: name || 'Документ (ссылка)'
          };
        }
      }
    },

    save_attachments_to_documents: {
      label: 'Сохранить вложения письма в Документы',
      inputSchema: {
        properties: {
          mail_id: { type: 'string', label: 'ID письма', placeholder: '{{step1.emails[0].id}}' },
          filter_ext: { type: 'string', label: 'Фильтр по расширению (необязательно)', placeholder: '.txt,.csv' },
        }
      },
      handler: async (config, context, logger) => {
        const { mail_id, filter_ext } = config;
        if (!mail_id) throw new Error('[mail.save_attachments_to_documents] mail_id обязателен');
        if (mail_id.startsWith('{{') && mail_id.endsWith('}}')) {
           logger?.warn(`Переменная ${mail_id} не была разрешена. Пропуск шага.`);
           return { success: true, documents: [], found: false, skipped: true };
        }

        const { rows: attachments } = await db.query(
          'SELECT id, filename, stored_path FROM mail_attachments WHERE mail_id = $1',
          [mail_id]
        );

        if (attachments.length === 0) {
           logger?.log(`Письмо ${mail_id} не содержит вложений.`);
           return { success: true, documents: [], found: false };
        }

        const exts = filter_ext ? filter_ext.split(',').map(e => e.trim().toLowerCase()) : null;

        const docs = [];
        const { absPath, relPathForDB } = await getWorkflowStorageInfo();
        const unzipper = require('unzipper');

        for (const attachment of attachments) {
          const sourcePath = mailHelpers.resolveAttachmentPath(attachment.storedPath);
          if (!fs.existsSync(sourcePath)) {
            logger?.warn(`Файл вложения не найден на диске: ${sourcePath}`);
            continue;
          }

          const originalExt = path.extname(attachment.filename).toLowerCase();
          const folderId = await getOrCreateFolder('Workflow');

          if (originalExt === '.zip') {
            try {
              const directory = await unzipper.Open.file(sourcePath);
              for (const file of directory.files) {
                if (file.type === 'Directory') continue;
                
                const fileExt = path.extname(file.path).toLowerCase();
                if (exts && !exts.some(ext => file.path.toLowerCase().endsWith(ext))) continue;

                const uuid = uuidv4();
                const storedFilename = `${relPathForDB}${uuid}${fileExt}`;
                const destPath = path.join(absPath, `${uuid}${fileExt}`);
                
                const buffer = await file.buffer();
                fs.writeFileSync(destPath, buffer);
                const size = buffer.length;

                const docId = `doc-wf-${Date.now()}-${Math.floor(Math.random()*1000)}`;
                const { rows } = await db.query(
                  `INSERT INTO documents (id, name, type, size, date, stored_filename, parent_id)
                   VALUES ($1, $2, 'file', $3, $4, $5, $6) RETURNING id, name`,
                  [docId, path.basename(file.path), size, new Date().toISOString().split('T')[0], storedFilename, folderId]
                );

                docs.push({
                   documentId: rows[0].id,
                   name: rows[0].name,
                   storedFilename
                });
              }
            } catch (err) {
              logger?.warn(`Ошибка распаковки ${attachment.filename}: ${err.message}`);
            }
          } else {
            if (exts && !exts.some(ext => attachment.filename.toLowerCase().endsWith(ext))) continue;

            const uuid = uuidv4();
            const storedFilename = `${relPathForDB}${uuid}${originalExt}`;
            const destPath = path.join(absPath, `${uuid}${originalExt}`);
            
            fs.copyFileSync(sourcePath, destPath);
            const size = fs.statSync(destPath).size;

            const docId = `doc-wf-${Date.now()}-${Math.floor(Math.random()*1000)}`;
            const { rows } = await db.query(
              `INSERT INTO documents (id, name, type, size, date, stored_filename, parent_id)
               VALUES ($1, $2, 'file', $3, $4, $5, $6) RETURNING id, name`,
              [docId, attachment.filename, size, new Date().toISOString().split('T')[0], storedFilename, folderId]
            );

            docs.push({
               documentId: rows[0].id,
               name: rows[0].name,
               storedFilename
            });
          }
        }

        logger?.info(`Сохранено ${docs.length} вложений в документы.`);
        return { success: true, documents: docs, found: docs.length > 0, firstDocumentId: docs[0]?.documentId };
      }
    },

    send_email: {
      label: 'Отправить письмо',
      inputSchema: {
        properties: {
          account_id: { type: 'account', label: 'Отправитель (аккаунт)' },
          to:         { type: 'string',  label: 'Кому (email)', placeholder: 'email получателя' },
          subject:    { type: 'string',  label: 'Тема',          placeholder: '' },
          body:       { type: 'string',  label: 'Тело письма',   placeholder: '' },
        }
      },
      handler: async (config, context) => {
        const { account_id, to, subject, body } = config;
        if (!to || !subject) throw new Error('[mail.send_email] "to" и "subject" обязательны');
        if (!account_id) throw new Error('[mail.send_email] account_id обязателен');
        
        // Lazy import to avoid circular deps
        const mailSendService = require('./services/mailSendService');
        
        const result = await mailSendService.sendMailImmediately({
          accountId: account_id,
          userId: context.user_id || context.userId || context.trigger?.user || 'system',
          to,
          subject,
          htmlContent: body,
          textContent: body
        });
        
        return { success: true, to, subject, messageId: result?.messageId || null };
      }
    },

    mark_as_read: {
      label: 'Отметить письмо как прочитанное',
      inputSchema: {
        properties: {
          mail_id: { type: 'string', label: 'ID письма', placeholder: 'ID письма (из шага получения писем)' },
          is_read: { type: 'boolean', label: 'Статус (прочитано)', default: true },
        }
      },
      handler: async (config, context, logger) => {
        const { mail_id, is_read = true } = config;
        if (!mail_id) throw new Error('[mail.mark_as_read] mail_id обязателен');
        if (mail_id.startsWith('{{') && mail_id.endsWith('}}')) {
           logger?.warn(`Переменная ${mail_id} не была разрешена. Пропуск шага.`);
           return { success: true, skipped: true };
        }

        const { rows: mailRows } = await db.query(
          'SELECT id, account_id, folder_id, imap_uid, user_id FROM mail WHERE id = $1',
          [mail_id]
        );
        if (mailRows.length === 0) throw new Error(`Mail ${mail_id} not found`);
        const mail = mailRows[0];

        // Sync to IMAP if we have info
        if (mail.imapUid && mail.accountId && mail.folderId) {
          try {
            const { rows: folderRows } = await db.query(
              'SELECT folder_name, folder_type, imap_folder_path FROM mail_folders WHERE id = $1', 
              [mail.folderId]
            );
            if (folderRows.length > 0) {
              const boxPath = mailHelpers.resolveImapBoxPath(folderRows[0]);
              await mailHelpers.setFlagImap(mail.userId, mail.accountId, mail.imapUid, '\\Seen', is_read, boxPath);
            }
          } catch (e) {
            console.error('[mail.mark_as_read] IMAP sync failed:', e.message);
            // Non-blocking for workflow
          }
        }

        const { rows } = await db.query(
          'UPDATE mail SET read = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
          [is_read, mail_id]
        );

        return { success: true, mailId: mail_id, isRead: is_read };
      }
    },

    log_processing_status: {
      label: 'Логировать статус обработки писем',
      isReadOnly: true,
      inputSchema: {
        properties: {
          processed_count:  { type: 'number',  label: 'Кол-во обработанных писем' },
          total_matching:   { type: 'number',  label: 'Всего писем соответствующих критериям' },
          limit:            { type: 'number',  label: 'Установленный лимит' },
          has_more:         { type: 'boolean', label: 'Есть ли еще писем' },
          is_complete:      { type: 'boolean', label: 'Обработаны ли все' },
          unread_count:     { type: 'number',  label: 'Кол-во новых писем' },
          message:          { type: 'string',  label: 'Дополнительное сообщение' },
        }
      },
      handler: async (config, context, logger) => {
        const processed_count = parseInt(config.processed_count) || 0;
        const total_matching = parseInt(config.total_matching) || 0;
        const limit = parseInt(config.limit) || 0;
        const unread_count = parseInt(config.unread_count) || 0;
        const has_more = !!config.has_more;
        const is_complete = !!config.is_complete;
        const message = config.message || '';
        
        const status = is_complete ? '✅ ЗАВЕРШЕНО' : (has_more ? '⏳ ЕСТЬ ЕЩЕ' : '⚠️  В ПРОЦЕССЕ');
        const progressPercent = total_matching > 0 ? Math.round((processed_count / total_matching) * 100) : 0;
        
        logger?.info(`
        
📊 СТАТУС ОБРАБОТКИ ПИСЕМ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Статус:              ${status}
  Обработано:          ${processed_count}/${total_matching} (${progressPercent}%)
  Новых писем:         ${unread_count}
  Лимит на запрос:     ${limit}
  Есть еще писем:      ${has_more ? 'ДА' : 'НЕТ'}
  Требуется повторить: ${has_more ? 'ДА' : 'НЕТ'}
${message ? `  Сообщение:          ${message}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);
        
        return { 
          success: true, 
          status,
          progress: progressPercent,
          needs_retry: has_more,
          summary: `Обработано ${processed_count} из ${total_matching} писем (${progressPercent}%)`
        };
      }
    },

  }
};
