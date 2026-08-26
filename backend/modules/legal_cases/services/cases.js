/**
 * Бизнес-логика для юридических дел
 */

const db = require('../../../db');
const logger = require('../../../utils/logger');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const {
  normalizeCaseCoreFields,
  hydrateCaseRelations,
  getCaseNotesInternalColumn,
} = require('../utils/helpers');
const { createCaseUpdate } = require('./updates');

let cachedThirdPartyRoleColumn = null;

async function getThirdPartyRoleColumn() {
  if (cachedThirdPartyRoleColumn) {
    return cachedThirdPartyRoleColumn;
  }

  const { rows } = await db.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_name = 'case_third_parties'
       AND column_name IN ('role', 'type')`
  );

  const availableColumns = new Set(rows.map((row) => row.columnName || row.column_name));

  if (availableColumns.has('role')) {
    cachedThirdPartyRoleColumn = 'role';
    return cachedThirdPartyRoleColumn;
  }

  if (availableColumns.has('type')) {
    cachedThirdPartyRoleColumn = 'type';
    return cachedThirdPartyRoleColumn;
  }

  throw new Error('Table case_third_parties must contain either role or type column');
}

async function resolveThirdPartyId(candidateId, caseId) {
  const normalizedCandidate = typeof candidateId === 'string' ? candidateId.trim() : '';
  const shouldGenerate = !normalizedCandidate || normalizedCandidate.startsWith('tp-temp-');

  if (shouldGenerate) {
    return `tp-${randomUUID()}`;
  }

  const { rows } = await db.query(
    'SELECT case_id FROM case_third_parties WHERE id = $1 LIMIT 1',
    [normalizedCandidate]
  );

  if (!rows.length) {
    return normalizedCandidate;
  }

  const existingCaseId = rows[0].caseId || rows[0].case_id;
  if (existingCaseId === caseId) {
    return normalizedCandidate;
  }

  return `tp-${randomUUID()}`;
}

/**
 * Удалить физический файл с диска асинхронно
 * @param {string} filePath - Путь к файлу
 * @returns {Promise<boolean>} Успешность удаления
 */
async function deletePhysicalFileAsync(filePath) {
  return new Promise((resolve) => {
    if (!fs.existsSync(filePath)) {
      resolve(false);
      return;
    }

    fs.unlink(filePath, (err) => {
      if (err) {
        logger.warn('Failed to delete attachment file', { path: filePath, error: err.message });
        resolve(false);
      } else {
        logger.debug('Attachment file deleted', { path: filePath });
        resolve(true);
      }
    });
  });
}

/**
 * Генерировать уникальный ID для заметки
 * @returns {string} Уникальный ID
 */
function generateNoteId() {
  try {
    return `note-${randomUUID()}`;
  } catch (err) {
    // Fallback на случай если crypto недоступен
    return `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Получить все дела для списка (без N+1 — только JOIN с финансами и счётчик обновлений)
 * Полная гидратация (events, notes, docs) происходит только в getCaseById()
 * @returns {Promise<Array>}
 */
async function getAllCases() {
  const { rows } = await db.query(`
    SELECT
      lc.*,
      COALESCE(cfd.claim_amount, 0)      AS claim_amount_val,
      COALESCE(cfd.claim_currency, 'RUB') AS claim_currency_val,
      COUNT(cu.id) FILTER (WHERE cu.is_viewed = false) AS unviewed_updates_count,
      u.avatar AS lawyer_avatar
    FROM legal_cases lc
    LEFT JOIN case_financial_details cfd ON cfd.case_id = lc.id
    LEFT JOIN case_record_updates     cu  ON cu.case_id  = lc.id
    LEFT JOIN employees e ON lc.lawyer_id = 'emp-' || e.id::text
    LEFT JOIN users u ON (u.id = e.user_id) OR (lc.lawyer_id = 'user-' || u.id::text)
    GROUP BY lc.id, cfd.claim_amount, cfd.claim_currency, u.avatar
    ORDER BY lc.id DESC
  `);

  return rows.map(row => {
    normalizeCaseCoreFields(row);
    // Встраиваем финансы из JOIN
    if (!row.claimAmount) {
      row.claimAmount = {
        amount:   Number(row.claimAmountVal || row.claim_amount_val || 0),
        currency: row.claimCurrencyVal || row.claim_currency_val || 'RUB',
      };
    }
    row.unviewedUpdates    = [];
    row.hasUnviewedUpdates = Number(row.unviewedUpdatesCount || row.unviewed_updates_count || 0) > 0;
    return row;
  });
}

/**
 * Получить дело по ID с детализацией
 * @param {string} id - ID дела
 * @returns {Promise<Object|null>}
 */
async function getCaseById(id) {
  const { rows } = await db.query(`
    SELECT lc.*, u.avatar AS lawyer_avatar
    FROM legal_cases lc
    LEFT JOIN employees e ON lc.lawyer_id = 'emp-' || e.id::text
    LEFT JOIN users u ON (u.id = e.user_id) OR (lc.lawyer_id = 'user-' || u.id::text)
    WHERE lc.id = $1
  `, [id]);

  if (rows.length === 0) return null;

  const caseRow = rows[0];
  normalizeCaseCoreFields(caseRow);
  await hydrateCaseRelations(caseRow);

  return caseRow;
}

/**
 * Создать новое дело
 * @param {Object} caseData - Данные дела
 * @param {Object} financialData - Финансовые данные
 * @returns {Promise<Object>}
 */
async function createCase(caseData, financialData) {
  const notesCol = await getCaseNotesInternalColumn();
  const thirdPartyRoleColumn = await getThirdPartyRoleColumn();

  const { rows } = await db.query(
    `INSERT INTO legal_cases
       (id, title, type, status, outcome, lawyer_id, lawyer_name, client, plaintiff, defendant, judge,
        court_name, case_number, first_instance_number, creation_date, deadline,
        sent_date, response_due_date, price, description)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING *`,
    [
      caseData.id, caseData.title, caseData.type, caseData.status, caseData.outcome,
      caseData.lawyer_id, caseData.lawyer_name, caseData.client,
      caseData.plaintiff, caseData.defendant, caseData.judge,
      caseData.court_name, caseData.case_number,
      caseData.first_instance_number || caseData.firstInstanceNumber || null,
      caseData.creation_date,
      caseData.deadline,
      caseData.sent_date || caseData.sentDate || null,
      caseData.response_due_date || caseData.responseDueDate || null,
      caseData.price, caseData.description
    ]
  );

  // Вставляем финансовые детали
  await db.query(
    `INSERT INTO case_financial_details
       (case_id, claim_amount, claim_currency, state_duty, expertise_cost, other_claim_costs,
        recovered_amount, recovered_currency, enforcement_fee, execution_costs,
        transport_expenses, translation_expenses, other_expenses)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [
      caseData.id,
      financialData.claim_amount, financialData.claim_currency,
      financialData.state_duty, financialData.expertise_cost, financialData.other_claim_costs,
      financialData.recovered_amount, financialData.recovered_currency,
      financialData.enforcement_fee, financialData.execution_costs,
      financialData.transport_expenses, financialData.translation_expenses, financialData.other_expenses
    ]
  );

  // Вставляем третьи лица если есть
  if (Array.isArray(caseData.thirdParties)) {
    for (const tp of caseData.thirdParties) {
      const tpId = await resolveThirdPartyId(tp.id, caseData.id);
      await db.query(
        `INSERT INTO case_third_parties (id, case_id, name, ${thirdPartyRoleColumn}) VALUES ($1,$2,$3,$4)`,
        [tpId, caseData.id, tp.name, tp.role || tp.type || 'third_party']
      );
    }
  }

  // Вставляем события если есть
  if (Array.isArray(caseData.events)) {
    for (const ev of caseData.events) {
      const evId = ev.id || `ev-${randomUUID()}`;
      await db.query(
        `INSERT INTO case_events (id, case_id, title, date, type, description, author) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [evId, caseData.id, ev.title, ev.date, ev.type || 'event', ev.description || '', ev.author || 'system']
      );
    }
  }

  // Вставляем документы если есть
  if (Array.isArray(caseData.documents)) {
    for (const doc of caseData.documents) {
      if (!doc?.id) {
        continue;
      }

      await db.query(
        `UPDATE case_documents
         SET case_id = $1,
             name = COALESCE($2, name),
             type = COALESCE($3, type),
             url = COALESCE($4, url),
             date = COALESCE($5, date),
             size = COALESCE($6, size),
             author = COALESCE($7, author)
         WHERE id = $8`,
        [
          caseData.id,
          doc.name,
          doc.type || 'document',
          doc.url || '',
          doc.date,
          doc.size,
          doc.author,
          doc.id,
        ]
      );
    }
  }

  // Создаем автоматическое событие о создании дела
  try {
    await addCaseEvent(caseData.id, {
      title: 'Дело создано',
      description: `Создано новое юридическое дело. Номер: ${caseData.case_number || '—'}. Юрист: ${caseData.lawyer_name || '—'}.`,
      type: 'document',
      author: 'system'
    });
  } catch (err) {
    logger.warn('Failed to create "Case Created" event', err);
  }

  // Возвращаем созданное дело с детализацией
  return await getCaseById(caseData.id);
}

/**
 * Обновить дело
 * @param {string} id - ID дела
 * @param {Object} updates - Данные для обновления
 * @returns {Promise<Object|null>}
 */
async function updateCase(id, updates) {
  const existing = await getCaseById(id);
  if (!existing) return null;
  const thirdPartyRoleColumn = await getThirdPartyRoleColumn();

  // Обновляем основные поля
  // Используем объект для сопоставления полей, чтобы избежать дублирования логики COALESCE
  const { rows } = await db.query(
    `UPDATE legal_cases
     SET title = COALESCE($1, title),
         type = COALESCE($2, type),
         status = COALESCE($3, status),
         outcome = COALESCE($4, outcome),
         lawyer_id = COALESCE($5, lawyer_id),
         lawyer_name = COALESCE($6, lawyer_name),
         client = COALESCE($7, client),
         plaintiff = COALESCE($8, plaintiff),
         defendant = COALESCE($9, defendant),
         judge = COALESCE($10, judge),
         court_name = COALESCE($11, court_name),
         case_number = COALESCE($12, case_number),
         first_instance_number = COALESCE($13, first_instance_number),
         creation_date = COALESCE($14, creation_date),
         deadline = COALESCE($15, deadline),
         sent_date = COALESCE($16, sent_date),
         response_due_date = COALESCE($17, response_due_date),
         price = COALESCE($18, price),
         description = COALESCE($19, description)
     WHERE id = $20
     RETURNING *`,
    [
      updates.title !== undefined ? updates.title : null,
      updates.type !== undefined ? updates.type : null,
      updates.status !== undefined ? updates.status : null,
      updates.outcome !== undefined ? updates.outcome : null,
      (updates.lawyer_id !== undefined ? updates.lawyer_id : (updates.lawyerId !== undefined ? updates.lawyerId : null)),
      (updates.lawyer_name !== undefined ? updates.lawyer_name : (updates.lawyerName !== undefined ? updates.lawyerName : null)),
      updates.client !== undefined ? updates.client : null,
      updates.plaintiff !== undefined ? updates.plaintiff : null,
      updates.defendant !== undefined ? updates.defendant : null,
      updates.judge !== undefined ? updates.judge : null,
      (updates.court_name !== undefined ? updates.court_name : (updates.courtName !== undefined ? updates.courtName : null)),
      (updates.case_number !== undefined ? updates.case_number : (updates.caseNumber !== undefined ? updates.caseNumber : null)),
      (updates.first_instance_number !== undefined ? updates.first_instance_number : (updates.firstInstanceNumber !== undefined ? updates.firstInstanceNumber : null)),
      (updates.creation_date !== undefined ? updates.creation_date : (updates.creationDate !== undefined ? updates.creationDate : null)),
      updates.deadline !== undefined ? updates.deadline : null,
      (updates.sent_date !== undefined ? updates.sent_date : (updates.sentDate !== undefined ? updates.sentDate : null)),
      (updates.response_due_date !== undefined ? updates.response_due_date : (updates.responseDueDate !== undefined ? updates.responseDueDate : null)),
      updates.price !== undefined ? updates.price : null,
      updates.description !== undefined ? updates.description : null,
      id
    ]
  );

  // Создаем обновление если статус изменился
  if (updates.status && existing.status !== updates.status) {
    try {
      const statusLabels = {
        'new': 'Новое',
        'process': 'В работе',
        'active': 'Активно',
        'won': 'Выиграно',
        'lost': 'Проиграно',
        'archived': 'В архиве',
        'done': 'Завершено'
      };
      
      const oldLabel = statusLabels[existing.status] || existing.status;
      const newLabel = statusLabels[updates.status] || updates.status;
      
      await createCaseUpdate({
        case_id: id,
        lawyer_id: updates.lawyer_id || updates.lawyerId || existing.lawyer_id || existing.lawyerId,
        update_type: 'case_update',
        title: 'Статус дела изменен',
        description: `Статус изменен с "${oldLabel}" на "${newLabel}"`
      });

      // Также добавляем в Таймлайн (Timeline)
      await addCaseEvent(id, {
        title: 'Изменение статуса',
        description: `Статус изменен: ${oldLabel} → ${newLabel}`,
        type: 'court',
        author: 'system'
      });

      logger.info('[UPDATE CASE] Case update notification and event created', {
        caseId: id,
        oldStatus: existing.status,
        newStatus: updates.status
      });
    } catch (err) {
      logger.error('[UPDATE CASE] Error creating update notification/event:', err);
    }
  }

  // Обновляем финансовые детали если есть
  if (updates.financials) {
    await db.query(
      `UPDATE case_financial_details
       SET claim_amount = COALESCE($1, claim_amount),
           claim_currency = COALESCE($2, claim_currency),
           state_duty = COALESCE($3, state_duty),
           expertise_cost = COALESCE($4, expertise_cost),
           other_claim_costs = COALESCE($5, other_claim_costs),
           recovered_amount = COALESCE($6, recovered_amount),
           recovered_currency = COALESCE($7, recovered_currency),
           enforcement_fee = COALESCE($8, enforcement_fee),
           execution_costs = COALESCE($9, execution_costs),
           transport_expenses = COALESCE($10, transport_expenses),
           translation_expenses = COALESCE($11, translation_expenses),
           other_expenses = COALESCE($12, other_expenses)
       WHERE case_id = $13`,
      [
        updates.financials.claim_amount, updates.financials.claim_currency,
        updates.financials.state_duty, updates.financials.expertise_cost,
        updates.financials.other_claim_costs,
        updates.financials.recovered_amount, updates.financials.recovered_currency,
        updates.financials.enforcementFee, updates.financials.execution_costs,
        updates.financials.transport_expenses, updates.financials.translation_expenses,
        updates.financials.other_expenses, id
      ]
    );

    // Добавляем в Таймлайн
    try {
      await addCaseEvent(id, {
        title: 'Обновлены финансовые данные',
        description: 'Внесены изменения в финансовые показатели дела.',
        type: 'finance',
        author: 'system'
      });
    } catch (err) {
      logger.warn('Failed to create timeline event for financial update', err);
    }
  }

  // Сохраняем заметки если есть
  if (Array.isArray(updates.notes)) {
    logger.info(`Saving ${updates.notes.length} notes for case ${id}`);
    logger.info(`Note IDs to save:`, updates.notes.map(n => ({ id: n.id, text: n.text?.substring(0, 30) + '...' })));
    
    // Удаляем старые заметки и вложения
    const { rows: oldNotes } = await db.query('SELECT id FROM case_notes WHERE case_id = $1', [id]);
    logger.info(`Found ${oldNotes.length} old notes to delete`);
    logger.info(`Old note IDs:`, oldNotes.map(n => n.id));
    
    for (const note of oldNotes) {
      // Получаем информацию о вложениях перед удалением
      const { rows: attachments } = await db.query(
        'SELECT url FROM case_note_attachments WHERE note_id = $1',
        [note.id]
      );
      logger.info(`Found ${attachments.length} attachments for note ${note.id}`);
      
      // Удаляем физические файлы вложений
      for (const attachment of attachments) {
        if (attachment.url) {
          const filename = attachment.url.split('/').pop();
          const filePath = path.join(__dirname, '../../../uploads/legal-cases', filename);
          await deletePhysicalFileAsync(filePath);
        }
      }
      
      // Удаляем записи о вложениях из БД
      await db.query('DELETE FROM case_note_attachments WHERE note_id = $1', [note.id]);
      // Удаляем заметку из БД
      await db.query('DELETE FROM case_notes WHERE id = $1', [note.id]);
    }

    // Вставляем новые заметки
    for (const note of updates.notes) {
      const noteId = note.id || generateNoteId();
      const internalCol = await getCaseNotesInternalColumn();
      
      logger.info(`Saving note: ${noteId}, text: ${note.text?.substring(0, 50)}...`);
      
      // Парсим дату - поддерживаем разные форматы
      let parsedDate = note.date || new Date().toISOString().split('T')[0];
      if (typeof parsedDate === 'string') {
        // Формат "2026, 10:56-03-27" → YYYY-MM-DD
        if (parsedDate.includes(',') && parsedDate.includes('-')) {
          const lastPart = parsedDate.split('-').slice(-2).join('-');
          const year = parsedDate.split(',')[0].trim();
          parsedDate = `${year}-${lastPart}`;
        }
        // Формат "DD.MM.YYYY" → YYYY-MM-DD
        else if (parsedDate.includes('.') && parsedDate.split('.').length === 3) {
          const parts = parsedDate.split('.');
          parsedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
      
      // Сначала вставляем заметку
      await db.query(
        `INSERT INTO case_notes (id, case_id, author, initials, date, text, "${internalCol}")
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO UPDATE SET
           text = EXCLUDED.text,
           "${internalCol}" = EXCLUDED."${internalCol}"`,
        [
          noteId,
          id,  // case_id
          note.author || 'User',
          note.initials || '',
          parsedDate,
          note.text || '',
          note.isInternal || false
        ]
      );

      // Сохраняем вложения заметки если есть
      if (Array.isArray(note.attachments) && note.attachments.length > 0) {
        logger.info(`Saving ${note.attachments.length} attachments for note ${noteId}`);
        for (const attachment of note.attachments) {
          // Используем существующий ID или генерируем новый
          const attachId = attachment.id || `attach-${randomUUID()}`;
          
          // Парсим дату вложения - поддерживаем разные форматы
          let addedAtDate = attachment.addedAt || new Date().toISOString().split('T')[0];
          if (typeof addedAtDate === 'string') {
            // Формат "2026, 10:56-03-27" → извлекаем YYYY-MM-DD
            if (addedAtDate.includes(',') && addedAtDate.includes('-')) {
              const lastPart = addedAtDate.split('-').slice(-2).join('-');
              const year = addedAtDate.split(',')[0].trim();
              addedAtDate = `${year}-${lastPart}`;
            }
            // Формат "DD.MM.YYYY" → YYYY-MM-DD
            else if (addedAtDate.includes('.') && addedAtDate.split('.').length === 3) {
              const parts = addedAtDate.split('.');
              addedAtDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
          }
          
          try {
            await db.query(
              `INSERT INTO case_note_attachments (id, note_id, case_id, name, url, type, added_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7)
               ON CONFLICT (id) DO NOTHING`,
              [
                attachId,
                noteId,  // note_id (существует после вставки заметки)
                id,      // case_id
                attachment.name,
                attachment.url || '',
                attachment.type || 'other',
                addedAtDate
              ]
            );
          } catch (err) {
            logger.error('Error saving attachment', { 
              noteId, 
              attachmentId: attachId, 
              error: err.message 
            });
            // Продолжаем с остальными вложениями вместо полного отказа
          }
        }
      }
    }
  }

  // Сохраняем документы если есть
  if (Array.isArray(updates.documents)) {
    const incomingIds = updates.documents
      .map(doc => doc?.id)
      .filter(Boolean);

    if (incomingIds.length > 0) {
      await db.query(
        `UPDATE case_documents
         SET case_id = $1
         WHERE id = ANY($2::text[])`,
        [id, incomingIds]
      );
    }

    const { rows: existingDocs } = await db.query(
      'SELECT id, url FROM case_documents WHERE case_id = $1',
      [id]
    );

    const incomingIdSet = new Set(incomingIds);
    const docsToDelete = existingDocs.filter(doc => !incomingIdSet.has(doc.id));

    for (const doc of docsToDelete) {
      if (doc.url) {
        const filename = doc.url.split('/').pop();
        const filePath = path.join(__dirname, '../../../uploads/legal-cases', filename);
        await deletePhysicalFileAsync(filePath);
      }

      await db.query('DELETE FROM case_documents WHERE id = $1', [doc.id]);
    }
  }

  // Обновляем третьи лица если есть в объекте
  if (Array.isArray(updates.thirdParties)) {
    // Удаляем старые
    await db.query('DELETE FROM case_third_parties WHERE case_id = $1', [id]);
    // Вставляем новые
    for (const tp of updates.thirdParties) {
      const tpId = await resolveThirdPartyId(tp.id, id);
      await db.query(
        `INSERT INTO case_third_parties (id, case_id, name, ${thirdPartyRoleColumn}) VALUES ($1,$2,$3,$4)`,
        [tpId, id, tp.name, tp.role || tp.type || 'third_party']
      );
    }
  }

  // Обновляем события если есть в объекте
  if (Array.isArray(updates.events)) {
    // Удаляем старые
    await db.query('DELETE FROM case_events WHERE case_id = $1', [id]);
    // Вставляем новые
    for (const ev of updates.events) {
      const evId = ev.id && !ev.id.startsWith('ev-temp-') ? ev.id : `ev-${randomUUID()}`;
      await db.query(
        `INSERT INTO case_events (id, case_id, title, date, type, description, author) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [evId, id, ev.title, ev.date, ev.type || 'event', ev.description || '', ev.author || 'system']
      );
    }
  }

  return await getCaseById(id);
}

/**
 * Удалить дело
 * @param {string} id - ID дела
 * @returns {Promise<boolean>}
 */
async function deleteCase(id) {
  // Простая проверка существования без загрузки связанных данных
  const { rows } = await db.query('SELECT id FROM legal_cases WHERE id = $1', [id]);
  if (rows.length === 0) return false;

  // Получаем все вложения в заметках для удаления файлов
  const { rows: attachments } = await db.query(
    `SELECT url FROM case_note_attachments WHERE case_id = $1`,
    [id]
  );
  
  // Удаляем физические файлы вложений
  for (const attachment of attachments) {
    if (attachment.url) {
      const filename = attachment.url.split('/').pop();
      const filePath = path.join(__dirname, '../../../uploads/legal-cases', filename);
      await deletePhysicalFileAsync(filePath);
    }
  }

  // Удаляем все документы дела и их физические файлы
  const { rows: documents } = await db.query(
    'SELECT url FROM case_documents WHERE case_id = $1',
    [id]
  );
  
  for (const doc of documents) {
    if (doc.url) {
      const filename = doc.url.split('/').pop();
      const filePath = path.join(__dirname, '../../../uploads/legal-cases', filename);
      await deletePhysicalFileAsync(filePath);
    }
  }

  // Теперь удаляем связанные данные, чтобы избежать нарушения FK
  await db.query('DELETE FROM case_note_attachments WHERE case_id = $1', [id]);
  await db.query('DELETE FROM case_notes WHERE case_id = $1', [id]);
  await db.query('DELETE FROM case_documents WHERE case_id = $1', [id]);
  await db.query('DELETE FROM case_events WHERE case_id = $1', [id]);
  await db.query('DELETE FROM case_third_parties WHERE case_id = $1', [id]);
  await db.query('DELETE FROM case_recovered_items WHERE case_id = $1', [id]);
  await db.query('DELETE FROM case_expenses WHERE case_id = $1', [id]);
  await db.query('DELETE FROM case_financial_details WHERE case_id = $1', [id]);

  // Теперь удаляем само дело
  await db.query('DELETE FROM legal_cases WHERE id = $1', [id]);
  return true;
}

/**
 * Добавить событие (Timeline) в дело
 * @param {string} caseId 
 * @param {Object} eventData 
 * @returns {Promise<Object>}
 */
async function addCaseEvent(caseId, eventData) {
  const id = eventData.id || `ev-${randomUUID()}`;
  const date = eventData.date || new Date().toLocaleDateString('ru-RU');
  
  const { rows } = await db.query(
    `INSERT INTO case_events (id, case_id, instance_id, title, date, type, description, author)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      id,
      caseId,
      eventData.instance_id || eventData.instanceId || null,
      eventData.title,
      date,
      eventData.type || 'event',
      eventData.description || '',
      eventData.author || 'system'
    ]
  );
  
  return rows[0];
}

module.exports = {
  getAllCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
  addCaseEvent,
};
