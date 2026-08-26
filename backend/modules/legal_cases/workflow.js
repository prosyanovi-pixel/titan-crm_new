/**
 * Workflow Actions для модуля Legal Cases
 */
const db = require('../../db');
const { updateCase, addCaseEvent } = require('./services/cases');
const { createCaseUpdate } = require('./services/updates');
const { ensureInstance } = require('./services/instances');
const { getOrCreateFolder } = require('../documents/utils/helpers');

module.exports = {
  actions: {

    ensure_case_instance: {
      label: 'Обеспечить наличие инстанции дела',
      inputSchema: {
        properties: {
          case_id:         { type: 'string', label: 'ID дела',               placeholder: '{{stepX.caseId}}' },
          instance_number: { type: 'string', label: 'Номер дела инстанции',  placeholder: '{{stepX.case_number}}' },
          instance_type:   { type: 'string', label: 'Тип инстанции',         default: 'first' },
          court_name:      { type: 'string', label: 'Суд',                   placeholder: '' },
          judge:           { type: 'string', label: 'Судья',                 placeholder: '' },
          status:          { type: 'string', label: 'Статус',                default: 'hearing' },
        }
      },
      handler: async (config, context, logger) => {
        const { case_id, instance_number, instance_type, court_name, judge, status } = config;
        let finalCaseId = case_id;
        
        // 1. If case_id is missing, try to find or create the case first
        if (!finalCaseId || finalCaseId === 'null') {
          logger?.info(`Case ID is missing, searching for case by number: ${instance_number}`);
          const { rows: existingCase } = await db.query(
            'SELECT id FROM legal_cases WHERE case_number = $1 OR title = $1 LIMIT 1',
            [instance_number]
          );

          if (existingCase.length > 0) {
            finalCaseId = existingCase[0].id;
            logger?.log(`Found existing case: ${finalCaseId}`);
          } else {
            logger?.info(`Case not found, creating a new stub case for number: ${instance_number}`);
            const newCaseId = `case-auto-${Date.now()}`;
            const { rows: newCase } = await db.query(
              `INSERT INTO legal_cases (id, title, case_number, status, description)
               VALUES ($1, $2, $3, $4, $5) RETURNING id`,
              [newCaseId, instance_number, instance_number, 'open', 'Created automatically by workflow']
            );
            finalCaseId = newCase[0].id;
            logger?.log(`New case created: ${finalCaseId}`);
          }
        }

        if (!instance_number) {
          throw new Error('[legal_cases.ensure_case_instance] instance_number обязателен');
        }

        logger?.info(`Ensuring case instance: ${instance_number} (${instance_type}) for case ${finalCaseId}`);

        const instance = await ensureInstance({
          case_id: finalCaseId,
          instance_number,
          instance_type,
          court_name,
          judge,
          status,
          is_active: true
        });

        logger?.log(`Instance ensured: ${instance.id} (Number: ${instance.instanceNumber || instance.instance_number})`);

        // Создаем уведомление об обновлении если это новая инстанция
        if (instance.isNew) {
          try {
            const { rows: caseRows } = await db.query('SELECT lawyer_id FROM legal_cases WHERE id = $1', [case_id]);
            const typeLabel = {
              'first': 'Первая инстанция',
              'appeal': 'Апелляция',
              'cassation': 'Кассация',
              'supervision': 'Надзор'
            }[instance_type] || instance_type;

            await createCaseUpdate({
              case_id,
              lawyer_id: caseRows[0]?.lawyer_id || null,
              update_type: 'case_update',
              title: 'Добавлена новая стадия (инстанция)',
              description: `Стадия: ${typeLabel}. Номер: ${instance_number}.`
            });

            // Также в Таймлайн
            await addCaseEvent(case_id, {
              instance_id: instance.id,
              title: `Новая стадия: ${typeLabel}`,
              description: `Добавлена инстанция ${instance_number}`,
              type: 'court',
              author: 'workflow'
            });
          } catch (err) {
            console.error('[legal_cases.ensure_case_instance] Update create error:', err.message);
          }
        }

        return {
          success: true,
          isNew: instance.isNew,
          instanceId: instance.id,
          caseId: finalCaseId,
          instanceNumber: instance.instanceNumber || instance.instance_number,
          instanceType: instance.instanceType || instance.instance_type
        };
      }
    },

    add_timeline_event: {
      label: 'Добавить событие в Таймлайн (Timeline)',
      inputSchema: {
        properties: {
          case_id:     { type: 'string', label: 'ID дела',        placeholder: '{{stepX.caseId}}' },
          instance_id: { type: 'string', label: 'ID инстанции (необязательно)', placeholder: '{{stepX.instanceId}}' },
          title:       { type: 'string', label: 'Заголовок',      placeholder: 'Событие' },
          description: { type: 'string', label: 'Описание',       placeholder: 'Описание события' },
          type:        { type: 'string', label: 'Тип события',    default: 'court' },
          author:      { type: 'string', label: 'Автор',          default: 'workflow' },
        }
      },
      handler: async (config, context, logger) => {
        const { case_id, instance_id, title, description, type, author } = config;
        if (!case_id || case_id === 'null') {
          logger?.log('No case_id provided to add_timeline_event. Skipping.');
          return { success: false, found: false };
        }
        if (!title) {
          throw new Error('[legal_cases.add_timeline_event] title обязателен');
        }

        const event = await addCaseEvent(case_id, {
          instance_id: instance_id || null,
          title,
          description,
          type,
          author
        });

        logger?.log(`Timeline event added: ${event.id}`);

        return {
          success: true,
          eventId: event.id
        };
      }
    },

    find_case_by_number: {
      label: 'Найти дело по номеру',
      isReadOnly: true,
      inputSchema: {
        properties: {
          case_number: {
            type: 'string',
            label: 'Номер дела',
            placeholder: 'Номер дела (из шага извлечения)'
          },
          excludeStatus: {
            type: 'string',
            label: 'Исключить статус',
            default: 'done',
            description: 'Обычно исключаются архивные дела'
          }
        }
      },
      outputSchema: {
        properties: {
          found: { type: 'boolean', label: 'Найдено' },
          caseId: { type: 'string', label: 'ID дела' },
          case_number: { type: 'string', label: 'Номер дела' },
          title: { type: 'string', label: 'Заголовок' },
          status: { type: 'string', label: 'Статус' },
          plaintiff: { type: 'string', label: 'Истец' },
          defendant: { type: 'string', label: 'Ответчик' },
          lawyerId: { type: 'string', label: 'ID юриста' },
          lawyerName: { type: 'string', label: 'Имя юриста' }
        }
      },
      handler: async (config, context, logger) => {
        const { case_number, excludeStatus = 'done' } = config;
        logger?.info(`Searching for legal case with number/title matching "${case_number}" (excluding "${excludeStatus}")`);
        if (!case_number) {
          logger?.log('No case number provided to find_case_by_number. Skipping search.');
          return { found: false, caseId: null };
        }

        let query = `SELECT * FROM legal_cases WHERE (case_number ILIKE $1 OR title ILIKE $1)`;
        const params = [`%${case_number}%`];

        if (excludeStatus) {
           query += ` AND status != $2`;
           params.push(excludeStatus);
        }
        
        const { rows } = await db.query(query + ' LIMIT 1', params);

        if (rows.length > 0) {
          logger?.log(`Matching case found: "${rows[0].title}" (Status: ${rows[0].status}, ID: ${rows[0].id})`);
        } else {
          logger?.log(`No legal case found matching "${case_number}" with status filter applied.`);
        }

        return {
          found: rows.length > 0,
          caseId: rows[0]?.id || null,
          case_number: rows[0]?.case_number || null,
          title: rows[0]?.title || null,
          status: rows[0]?.status || null,
          plaintiff: rows[0]?.plaintiff || null,
          defendant: rows[0]?.defendant || null,
          lawyerId: rows[0]?.lawyer_id || null,
          lawyerName: rows[0]?.lawyer_name || null
        };
      }
    },

    find_case_by_title: {
      label: 'Найти дело по ключевому слову',
      isReadOnly: true,
      inputSchema: {
        properties: {
          keyword: { type: 'string', label: 'Ключевое слово', placeholder: 'Иванов' },
          status:  { type: 'string', label: 'Статус (оставьте пустым для всех)', placeholder: 'open' },
        }
      },
      outputSchema: {
        properties: {
          caseId: { type: 'string', label: 'ID первого найденного' },
          count: { type: 'number', label: 'Количество найденных' }
        }
      },
      handler: async (config, context) => {
        const { keyword, status } = config;
        let query  = 'SELECT * FROM legal_cases WHERE title ILIKE $1';
        const params = [`%${keyword || ''}%`];
        if (status) { query += ' AND status = $2'; params.push(status); }
        query += ' LIMIT 10';
        const { rows } = await db.query(query, params);
        return { cases: rows, count: rows.length, caseId: rows[0]?.id || null };
      }
    },

    attach_document_to_case: {
      label: 'Прикрепить документ к делу',
      inputSchema: {
        properties: {
          case_id:      { type: 'string', label: 'ID дела',        placeholder: '{{step3.caseId}}' },
          instance_id:  { type: 'string', label: 'ID инстанции (необязательно)', placeholder: '{{stepX.instanceId}}' },
          document_id:  { type: 'string', label: 'ID документа (из БД)',   placeholder: 'ID документа (из шага загрузки)' },
          doc_name:     { type: 'string', label: 'Имя документа',  placeholder: 'Имя документа' },
          stored_file:  { type: 'string', label: 'Файл (на диске)',  placeholder: 'Имя файла (из шага загрузки)' },
          external_url: { type: 'string', label: 'Внешняя ссылка',   placeholder: 'http://...' },
        }
      },
      outputSchema: {
        properties: {
          success: { type: 'boolean', label: 'Успешно' },
          caseDocId: { type: 'string', label: 'ID в case_documents' },
          documentName: { type: 'string', label: 'Имя документа' }
        }
      },
      handler: async (config, context) => {
        const { case_id, instance_id, document_id, doc_name, stored_file, external_url } = config;
        if (!case_id || case_id === 'null') {
          return { success: false, error: 'case_id is missing' };
        }
        if (!doc_name) {
          throw new Error('[legal_cases.attach_document_to_case] doc_name обязателен');
        }

        // Verify case exists
        const { rows: caseRows } = await db.query('SELECT id, lawyer_id FROM legal_cases WHERE id = $1', [case_id]);
        if (caseRows.length === 0) throw new Error(`Legal case ${case_id} not found`);

        // Determine URL: prefer external_url, then look up document in DB
        let finalUrl = external_url || '';
        let fileSize = '0';
        let isExternal = false;

        if (document_id && !external_url) {
          // Verify document exists in documents table
          const { rows: docRows } = await db.query('SELECT id, name, size FROM documents WHERE id = $1', [document_id]);
          if (docRows.length > 0) {
            fileSize = docRows[0].size || '0';
            finalUrl = `/api/legal-cases/documents/files/${stored_file || document_id}`;
          } else {
             console.warn(`[Workflow] Document ${document_id} not found in DB, using fallback name`);
          }
        }

        // If finalUrl is still empty or an external http link, mark as external
        if (finalUrl && (finalUrl.startsWith('http://') || finalUrl.startsWith('https://'))) {
          isExternal = true;
        }


        // Attach to case_documents table
        try {
          const caseDocId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const today = new Date().toLocaleDateString('ru-RU');

          const { rows: insertRows } = await db.query(
            `INSERT INTO case_documents (id, case_id, instance_id, name, type, date, size, url, author)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id, name, url`,
            [caseDocId, case_id, instance_id || null, doc_name, 'document', today, fileSize, finalUrl, 'workflow']
          );

          console.log('[legal_cases.attach_document_to_case] Document attached:', {
            caseId: case_id,
            caseDocId: insertRows[0].id,
            docName: insertRows[0].name,
            url: insertRows[0].url
          });

          try {
            await createCaseUpdate({
              case_id,
              lawyer_id: caseRows[0].lawyer_id || caseRows[0].lawyerId || null,
              update_type: 'document_added',
              title: 'Добавлен документ',
              description: `Документ прикреплен: ${doc_name}`
            });

            // В Таймлайн
            await addCaseEvent(case_id, {
              instance_id: instance_id || null,
              title: 'Добавлен документ',
              description: doc_name,
              type: 'document',
              author: 'workflow'
            });
          } catch (err) {
            console.error('[legal_cases.attach_document_to_case] Update create error:', err.message);
          }

          return {
            success: true,
            caseId: case_id,
            caseDocId: insertRows[0].id,
            documentId: document_id,
            documentName: insertRows[0].name,
          };
        } catch (e) {
          console.error('[legal_cases.attach_document_to_case] Error:', e.message);
          throw e;
        }
      }
    },

    create_legal_case: {
      label: 'Создать юридическое дело',
      inputSchema: {
        properties: {
          title:         { type: 'string', label: 'Название дела',    placeholder: 'Название дела' },
          case_number:   { type: 'string', label: 'Номер дела',       placeholder: 'Номер дела (если есть)' },
          description:   { type: 'string', label: 'Описание',         placeholder: '' },
          status:        { type: 'string', label: 'Начальный статус', default: 'open' },
          lawyer_id:     { type: 'string', label: 'ID юриста',        placeholder: '' },
          contractor_id: { type: 'string', label: 'ID контрагента',   placeholder: '' },
        }
      },
      outputSchema: {
        properties: {
          caseId: { type: 'string', label: 'ID созданного дела' }
        }
      },
      handler: async (config, context) => {
        const { title, case_number, description, status, lawyer_id, contractor_id } = config;
        if (!title) throw new Error('[legal_cases.create_legal_case] title обязателен');

        const caseId = `case-wf-${Date.now()}`;
        const { rows } = await db.query(
          `INSERT INTO legal_cases (id, title, case_number, description, lawyer_id, contractor_id, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [caseId, title, case_number || null, description || '', lawyer_id || null, contractor_id || null, status || 'open']
        );

        return { legalCase: rows[0], caseId: rows[0].id };
      }
    },

    update_case_status: {
      label: 'Изменить статус дела',
      inputSchema: {
        properties: {
          case_id: { type: 'string', label: 'ID дела',       placeholder: 'ID дела (из шага поиска)' },
          status:  { type: 'string', label: 'Новый статус',  default: 'in_progress' },
          note:    { type: 'string', label: 'Примечание',    placeholder: '' },
        }
      },
      outputSchema: {
        properties: {
          updated: { type: 'boolean', label: 'Обновлено' },
          status: { type: 'string', label: 'Новый статус' }
        }
      },
      handler: async (config, context) => {
        const { case_id, status, note, lawyer_id, lawyer_name } = config;
        if (!case_id || case_id === 'null') {
          return { updated: false, error: 'case_id is missing' };
        }
        if (!status) throw new Error('[legal_cases.update_case_status] status обязателен');

        const updatedCase = await updateCase(case_id, { status, lawyer_id, lawyer_name });
        if (!updatedCase) throw new Error(`Legal case ${case_id} not found`);

        return { updated: true, caseId: case_id, status, legalCase: updatedCase };
      }
    },

    generate_document_from_template: {
      label: 'Сгенерировать документ по шаблону',
      inputSchema: {
        properties: {
          case_id:         { type: 'string', label: 'ID дела',          placeholder: 'ID дела (из шага поиска)' },
          template_id:     { type: 'string', label: 'ID шаблона (Doc)', placeholder: 'doc-template-1' },
          output_filename: { type: 'string', label: 'Имя выходного файла', placeholder: 'Например: Договор_2026.docx' },
        }
      },
      outputSchema: {
        properties: {
          success: { type: 'boolean', label: 'Успешно' },
          documentId: { type: 'string', label: 'ID документа' },
          documentName: { type: 'string', label: 'Имя документа' },
          caseId: { type: 'string', label: 'ID дела' }
        }
      },
      handler: async (config, context) => {
        const { case_id, template_id, output_filename } = config;
        if (!case_id || !template_id) {
          throw new Error('[legal_cases.generate_document_from_template] case_id и template_id обязательны');
        }

        const PizZip = require('pizzip');
        const Docxtemplater = require('docxtemplater');
        const fs = require('fs');
        const path = require('path');

        // 1. Получаем данные дела
        const { rows: caseRows } = await db.query('SELECT * FROM legal_cases WHERE id = $1', [case_id]);
        if (caseRows.length === 0) throw new Error(`Legal case ${case_id} not found`);
        const legalCase = caseRows[0];

        // 2. Получаем шаблон
        const { rows: docRows } = await db.query('SELECT * FROM documents WHERE id = $1', [template_id]);
        if (docRows.length === 0) throw new Error(`Template document ${template_id} not found`);
        const templateDoc = docRows[0];
        
        const storedFilename = templateDoc.stored_filename || templateDoc.storedFilename;
        if (!storedFilename) throw new Error(`Template document ${template_id} has no stored_filename`);

        const uploadsDir = path.join(__dirname, '../../uploads/documents');
        const templatePath = path.join(uploadsDir, storedFilename);
        
        if (!fs.existsSync(templatePath)) {
          throw new Error(`Template file not found on disk: ${templatePath}`);
        }

        // 3. Подготовка данных для шаблона
        const templateData = {
          ...context, // Все переменные из workflow
          ...legalCase, // Все поля дела (title, case_number, и т.д.)
          today: new Date().toLocaleDateString('ru-RU'),
        };

        // 4. Генерация
        const content = fs.readFileSync(templatePath, 'binary');
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        });

        doc.render(templateData);

        const buf = doc.getZip().generate({
          type: 'nodebuffer',
          compression: 'DEFLATE',
        });

        // 5. Сохранение результата
        const newFilename = (output_filename || `Generated_${templateDoc.name}`)
          .replace(/\{\{case_number\}\}/g, legalCase.case_number || '000')
          .replace(/\\/g, '_')
          .replace(/\//g, '_');
        
        const uniqueSuffix = require('crypto').randomUUID();
        const storedOutputName = `${uniqueSuffix}.docx`;
        const outputPath = path.join(uploadsDir, storedOutputName);

        fs.writeFileSync(outputPath, buf);

        // 6. Регистрация в таблице documents
        let parentId = null;
        try {
          parentId = await getOrCreateFolder('Модуль Судебные дела');
        } catch (e) {
          console.warn('[legal_cases.generate_document_from_template] Folder error:', e.message);
        }

        const newDocId = `doc-gen-${Date.now()}`;
        const { rows: newDocRows } = await db.query(
          `INSERT INTO documents (id, name, type, size, date, parent_id, stored_filename)
           VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6) RETURNING *`,
          [newDocId, newFilename, 'doc', buf.length, parentId, storedOutputName]
        );

        // 7. Привязка к делу
        try {
          const linkId = `lc-doc-${Date.now()}`;
          await db.query(
            `INSERT INTO legal_case_documents (id, case_id, document_id, note, created_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [linkId, case_id, newDocId, 'Сгенерировано автоматически']
          );
        } catch (e) {
          console.warn('[legal_cases.generate_document_from_template] Link error (table may miss):', e.message);
        }

        return {
          success: true,
          documentId: newDocId,
          documentName: newFilename,
          caseId: case_id
        };
      }
    },

    add_case_note: {
      label: 'Добавить заметку к делу',
      inputSchema: {
        properties: {
          case_id:     { type: 'string',  label: 'ID дела',       placeholder: '{{step4.caseId}}' },
          text:        { type: 'string',  label: 'Текст заметки',  placeholder: 'Информация изменилась' },
          author:      { type: 'string',  label: 'Автор',         default: 'Система' },
          initials:    { type: 'string',  label: 'Инициалы',      default: 'WF' },
          is_internal: { type: 'boolean', label: 'Внутренняя',    default: false },
        }
      },
      handler: async (config, context) => {
        const { case_id, text, author = 'Система', initials = 'WF', is_internal = false } = config;
        if (!case_id || case_id === 'null') {
          return { success: false, error: 'case_id is missing' };
        }
        if (!text) throw new Error('[legal_cases.add_case_note] text обязателен');

        const { rows: caseRows } = await db.query('SELECT lawyer_id FROM legal_cases WHERE id = $1', [case_id]);
        if (caseRows.length === 0) throw new Error(`Legal case ${case_id} not found`);

        const noteId = `note-wf-${Date.now()}`;
        const date = new Date().toISOString().split('T')[0];

        const { rows } = await db.query(
          `INSERT INTO case_notes (id, case_id, author, initials, date, text, isinternal)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [noteId, case_id, author, initials, date, text, is_internal]
        );

        try {
          await createCaseUpdate({
            case_id,
            lawyer_id: caseRows[0].lawyer_id || caseRows[0].lawyerId || null,
            update_type: 'case_note',
            title: 'Добавлена заметка',
            description: text.length > 500 ? `${text.slice(0, 500)}...` : text
          });
        } catch (err) {
          console.error('[legal_cases.add_case_note] Update create error:', err.message);
        }

        return { success: true, noteId, note: rows[0] };
      }
    },

  }
};
