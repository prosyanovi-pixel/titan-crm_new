/**
 * Контроллеры модуля Contractors
 * Обработчики HTTP-запросов для управления контрагентами
 */

const { asyncHandler } = require('../../utils/errorHandler');
const { sendSuccess, sendCreated, sendNotFound, sendDeleted, sendPaginated } = require('../../utils/responseHelpers');
const db = require('../../db');
const { getModuleSettings } = require('../../utils/moduleSettingsLoader');
const { logAction } = require('../../utils/auditLogger');
const contractorTaxService = require('./services/contractorTaxService');
const { loadFullContractorsData, batchLoadContractorRelations, loadReferences, enrichContractorsWithReferences } = require('./utils/contractorDataLoader');
const { validateCreateRequest, validateUpdateRequest } = require('./validators/ContractorValidator');

/**
 * Загрузка связанные данных контрагента
 * @param {number} contractorId - ID контрагента
 * @returns {Promise<Object>} Объект с тегами, счетами и контактами
 */
const loadContractorRelations = async (contractorId) => {
  const tagsRes = await db.query('SELECT tag FROM contractor_tags WHERE contractor_id = $1', [contractorId]);
  const banksRes = await db.query('SELECT * FROM contractor_bank_accounts WHERE contractor_id = $1', [contractorId]);
  const contactsRes = await db.query('SELECT * FROM contractor_contacts WHERE contractor_id = $1', [contractorId]);

  return {
    tags: tagsRes.rows.map(r => r.tag),
    bankAccounts: banksRes.rows,
    contacts: contactsRes.rows
  };
};

/**
 * Загрузка mapping менеджеров (id -> name)
 * @returns {Promise<Object>} Объект с mapping { [id]: name }
 */
const loadManagersMapping = async () => {
  const { rows } = await db.query(
    "SELECT u.id, u.name FROM users u WHERE u.role IN ('manager', 'admin', 'Менеджер', 'Администратор')"
  );
  const mapping = {};
  rows.forEach(row => {
    mapping[row.id] = row.name;
    mapping[String(row.id)] = row.name;
  });
  return mapping;
};

/**
 * Обогащение контрагентов именами менеджеров
 * @param {Array} contractors - Массив контрагентов
 * @returns {Promise<Array>} Обогащённые контрагенты
 */
const enrichContractorsManagers = async (contractors) => {
  if (!contractors || contractors.length === 0) return contractors;
  const mapping = await loadManagersMapping();
  return contractors.map(c => {
    if (c.manager && mapping[c.manager]) {
      c.manager = mapping[c.manager];
    }
    return c;
  });
};

/**
 * Определение является ли контрагент сотрудником по типу отношений
 * @param {string} typeId - ID типа отношений
 * @returns {Promise<boolean>}
 */
const checkIsEmployee = async (typeId) => {
  if (!typeId) return false;
  
  const { rows } = await db.query('SELECT name FROM relationship_type WHERE id = $1', [typeId]);
  return rows.length && rows[0].name.toLowerCase().includes('сотрудник');
};

/**
 * Загрузка mapping статусов (id -> name)
 * @returns {Promise<Object>} Объект с mapping { [id]: name }
 */
const loadStatusesMapping = async () => {
  const { rows } = await db.query('SELECT id, name FROM contractor_status');
  const mapping = {};
  rows.forEach(row => {
    mapping[row.id] = row.name;
    mapping[String(row.id)] = row.name;
  });
  return mapping;
};

/**
 * Обогащение контрагентов русскими именами статусов
 * @param {Array} contractors - Массив контрагентов
 * @returns {Promise<Array>} Обогащённые контрагенты
 */
const enrichContractorsStatuses = async (contractors) => {
  if (!contractors || contractors.length === 0) return contractors;
  const mapping = await loadStatusesMapping();
  return contractors.map(c => {
    if (c.status && mapping[c.status]) {
      c.statusName = mapping[c.status];
    } else if (c.status) {
      // Fallback: capitalize ID if name not found
      c.statusName = c.status.charAt(0).toUpperCase() + c.status.slice(1);
    }
    return c;
  });
};

/**
 * Загрузка mapping типов отношений (id -> name)
 * @returns {Promise<Object>} Объект с mapping { [id]: name }
 */
const loadTypesMapping = async () => {
  const { rows } = await db.query('SELECT id, name FROM relationship_type');
  const mapping = {};
  rows.forEach(row => {
    mapping[row.id] = row.name;
    mapping[String(row.id)] = row.name;
  });
  return mapping;
};

/**
 * Обогащение контрагентов названиями типов отношений
 * @param {Array} contractors - Массив контрагентов
 * @returns {Promise<Array>} Обогащённые контрагенты
 */
const enrichContractorsTypes = async (contractors) => {
  if (!contractors || contractors.length === 0) return contractors;
  const mapping = await loadTypesMapping();
  return contractors.map(c => {
    if (c.type && mapping[c.type]) {
      c.typeName = mapping[c.type];
    } else if (c.type) {
      c.typeName = c.type;
    }
    return c;
  });
};

/**
 * Получить все записи контрагентов
 * @route GET /api/contractors
 * 
 * Поддерживает серверную пагинацию, фильтрацию и сортировку:
 * - search: поиск по name, full_name, inn, ogrn
 * - status: фильтр по статусу
 * - type: фильтр по типу отношений
 * - isEmployee: фильтр по признаку сотрудника (true/false)
 * - groupId: фильтр по группе правовых форм
 * - excludeStatus: исключить статус (например archived)
 * - page, limit: пагинация
 * - sortField, sortOrder: сортировка
 * 
 * Оптимизировано: батч-загрузка relations вместо N+1 запросов
 */
async function getAll(req, res) {
  const {
    search,
    page,
    limit,
    status,
    type,
    isEmployee,
    groupId,
    excludeStatus,
    sortField,
    sortOrder,
  } = req.query;

  const settings = await getModuleSettings('contractors');
  const defaultLimit = settings.display?.itemsPerPage || 50;
  const currentPage = Math.max(1, parseInt(page) || 1);
  const currentLimit = Math.min(parseInt(limit) || defaultLimit, 200);
  const offset = (currentPage - 1) * currentLimit;

  // By default exclude soft-deleted contractors
  const whereClauses = ['c.deleted_at IS NULL'];
  const values = [];
  let idx = 1;

  // Search filter
  if (search && search.trim()) {
    whereClauses.push(
      `(c.name ILIKE $${idx} OR c.full_name ILIKE $${idx} OR c.inn ILIKE $${idx} OR c.ogrn ILIKE $${idx} OR c.phone ILIKE $${idx})`
    );
    values.push(`%${search.trim()}%`);
    idx++;
  }

  // Status filter
  if (status) {
    whereClauses.push(`c.status = $${idx}`);
    values.push(status);
    idx++;
  }

  // Exclude status (e.g. hide archived)
  if (excludeStatus) {
    whereClauses.push(`c.status != $${idx}`);
    values.push(excludeStatus);
    idx++;
  }

  // Type (relationship type) filter
  if (type) {
    whereClauses.push(`c.type = $${idx}`);
    values.push(type);
    idx++;
  }

  // Employee filter
  if (isEmployee === 'true' || isEmployee === '1') {
    whereClauses.push(`c.is_employee = true`);
  } else if (isEmployee === 'false' || isEmployee === '0') {
    whereClauses.push(`c.is_employee = false`);
  }

  // Group filter (direct group_id or derived via legal_form -> legal_forms)
  if (groupId) {
    whereClauses.push(
      `(c.group_id = $${idx} OR c.legal_form IN (SELECT code FROM legal_forms WHERE group_id = $${idx}))`
    );
    values.push(groupId);
    idx++;
  }

  const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Total count
  const { rows: countRows } = await db.query(`SELECT COUNT(*) FROM contractors c ${where}`, values);
  const total = parseInt(countRows[0].count);

  // If "all" is requested, skip pagination
  if (req.query.all === 'true') {
    const { rows: allData } = await db.query(
      `SELECT c.* FROM contractors c ${where} ORDER BY c.name ASC`,
      values
    );
    const enriched = await loadFullContractorsData(allData);
    return sendSuccess(res, enriched);
  }

  // Sorting
  const allowedFields = ['name', 'status', 'manager', 'created_at', 'id', 'inn'];
  const field = allowedFields.includes(sortField) ? sortField : 'id';
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';
  const orderBy = `ORDER BY c.${field} ${order}`;

  // Data query
  const dataResult = await db.query(
    `SELECT c.* FROM contractors c ${where} ${orderBy} LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, currentLimit, offset]
  );

  // ОПТИМИЗАЦИЯ: батч-загрузка вместо N+1
  const enrichedRows = await loadFullContractorsData(dataResult.rows);

  sendPaginated(res, enrichedRows, {
    page: currentPage,
    limit: currentLimit,
    total,
  });
}

/**
 * Получить контрагента по ID
 * @route GET /api/contractors/:id
 * 
 * Оптимизировано: батч-загрузка relations
 */
async function getById(req, res) {
  const { id } = req.params;
  const { rows } = await db.query('SELECT * FROM contractors WHERE id = $1', [id]);

  if (rows.length === 0) {
    return sendNotFound(res, 'Contractor not found');
  }

  // ОПТИМИЗАЦИЯ: используем батч-загрузку (даже для одного)
  const enrichedContractors = await loadFullContractorsData(rows);
  sendSuccess(res, enrichedContractors[0]);
}

/**
 * Конвертация контрагента (смена формы собственности с сохранением преемственности)
 * @route POST /api/contractors/:id/convert
 */
async function convert(req, res) {
  try {
    const { id: predecessorId } = req.params;
    
    // 1. Проверяем существование старого контрагента
    const { rows: oldRows } = await db.query('SELECT id FROM contractors WHERE id = $1', [predecessorId]);
    if (oldRows.length === 0) return sendNotFound(res, 'Old contractor not found');

    // 2. Подготавливаем данные для создания нового
    const payload = req.body;
    
    // MDM FIO Logic (как в create)
    const { legalForm, legalEntityType, lastName, firstName, middleName } = payload;
    if (['private', 'self', 'ip', 'individual'].includes(legalForm) || ['private', 'individual'].includes(legalEntityType)) {
      if (lastName || firstName) {
        const builtName = [lastName, firstName, middleName].filter(Boolean).join(' ');
        if (!payload.name) payload.name = builtName;
        if (!payload.fullName) payload.fullName = builtName;
      }
    }

    // 3. Валидация
    const validation = await validateCreateRequest(payload);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: 'Ошибка валидации', errors: validation.errors });
    }

    const isEmployee = await checkIsEmployee(payload.type);

    // 4. Создаем нового контрагента с указанием predecessor_id
    const { rows } = await db.query(
      `INSERT INTO contractors (
          name, full_name, status, phone, manager, inn, kpp, ogrn,
          legal_form, legal_entity_type, type, currency, registration_date, director, director_position,
          legal_address, notes, is_employee, tax_regime_id, group_id,
          email, website, okved, okved_name, authorized_capital, is_active,
          gender, passport_series, passport_number, passport_issued_by, passport_issued_date, passport_unit_code, registration_address,
          okpo, okato,
          last_name, first_name, middle_name, snils, citizenship, country_code, registration_number, tax_id, kio, is_currency_resident, person_id,
          predecessor_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47)
       RETURNING *`,
      [
        payload.name, payload.fullName, payload.status, payload.phone, payload.manager, payload.inn, payload.kpp, payload.ogrn,
        payload.legalForm, payload.legalEntityType, payload.type, payload.currency, payload.registrationDate, payload.director, payload.directorPosition,
        payload.legalAddress, payload.notes, isEmployee,
        payload.taxRegimeId != null ? payload.taxRegimeId : null,
        payload.groupId || null,
        payload.email || null, payload.website || null, payload.okved || null, payload.okvedName || null,
        payload.authorizedCapital != null ? payload.authorizedCapital : null,
        payload.isActive != null ? payload.isActive : true,
        payload.gender || null, payload.passportSeries || null, payload.passportNumber || null, payload.passportIssuedBy || null, payload.passportIssuedDate || null, payload.passportUnitCode || null, payload.registrationAddress || null,
        payload.okpo || null, payload.okato || null,
        payload.lastName || null, payload.firstName || null, payload.middleName || null, payload.snils || null, payload.citizenship || null, payload.countryCode || null, payload.registrationNumber || null, payload.taxId || null, payload.kio || null, payload.isCurrencyResident !== undefined ? payload.isCurrencyResident : true, payload.personId || null,
        predecessorId
      ]
    );

    const newContractorId = rows[0].id;

    // 5. Копируем связи (теги, счета, контакты, документы)
    if (payload.tags && payload.tags.length > 0) {
      for (const tagIdentifier of [...new Set(payload.tags)]) {
        const { rows: existing } = await db.query('SELECT id FROM defined_tags WHERE (id = $1 OR name = $1) AND module = $2', [tagIdentifier, 'contractors']);
        let tagId;
        if (existing.length > 0) {
          tagId = existing[0].id;
        } else {
          const { rows: created } = await db.query('INSERT INTO defined_tags (id, name, color, module) VALUES ($1, $1, $2, $3) RETURNING id', [tagIdentifier, '#3B82F6', 'contractors']);
          tagId = created[0].id;
        }
        await db.query('INSERT INTO contractor_tags (contractor_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING', [newContractorId, String(tagId)]);
      }
    }

    if (payload.bankAccounts && payload.bankAccounts.length > 0) {
      for (const bank of payload.bankAccounts) {
        await db.query(
          `INSERT INTO contractor_bank_accounts (contractor_id, bank_name, bik, correspondent_account, account_number, is_primary, currency)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [newContractorId, bank.bankName, bank.bik, bank.correspondentAccount || null, bank.accountNumber, bank.isPrimary || false, bank.currency || 'RUB']
        );
      }
    }

    if (payload.contacts && payload.contacts.length > 0) {
      for (const contact of payload.contacts) {
        await db.query(
          `INSERT INTO contractor_contacts (id, contractor_id, name, position, phone, email, is_primary, person_id, authority_type, authority_document, work_phone, work_email)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          ['cc-' + Math.random(), newContractorId, contact.name, contact.position, contact.phone, contact.email, contact.isPrimary || false, contact.personId || null, contact.authorityType || null, contact.authorityDocument || null, contact.workPhone || null, contact.workEmail || null]
        );
      }
    }

    if (payload.documents && payload.documents.length > 0) {
      for (const doc of payload.documents) {
        await db.query(
          `INSERT INTO contractor_documents (contractor_id, type, series, number, issue_date, expiry_date, issued_by, department_code, is_primary, scan_copy_path)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [newContractorId, doc.type, doc.series || null, doc.number, doc.issueDate || null, doc.expiryDate || null, doc.issuedBy || null, doc.departmentCode || null, doc.isPrimary || false, doc.scanCopyPath || null]
        );
      }
    }

    // 6. Деактивируем старого контрагента
    await db.query('UPDATE contractors SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1', [predecessorId]);

    const enrichedContractors = await loadFullContractorsData(rows);
    const enrichedContractor = enrichedContractors[0];

    // Log action
    await logAction({
      userId: req.headers['x-user-id'],
      action: 'CONVERT',
      entityType: 'contractor',
      entityId: newContractorId,
      oldData: { id: predecessorId },
      newData: enrichedContractor,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    sendSuccess(res, enrichedContractor, 201);
  } catch (error) {
    console.error(`Error converting contractor ${req.params.id}:`, error);
    sendValidationError(res, error.message || 'Failed to convert contractor');
  }
}

/**
 * Создать нового контрагента
 * @route POST /api/contractors
 * 
 * Валидация: название обязательно, INN/KPP/OGRN должны быть корректными
 * Проверка: дубликат INN
 */
async function create(req, res) {
  let {
    name, fullName
  } = req.body;
  const { status, phone, manager, inn, kpp, ogrn,
    legalForm, legalEntityType, type, currency, registrationDate, director, directorPosition,
    legalAddress, notes, taxRegimeId, groupId,
    email, website, okved, okvedName, authorizedCapital, isActive,
    gender, passportSeries, passportNumber, passportIssuedBy, passportIssuedDate, passportUnitCode, registrationAddress,
    okpo, okato,
    tags, bankAccounts, contacts,
    // MDM fields
    lastName, firstName, middleName, snils, citizenship, countryCode, registrationNumber, taxId, kio, isCurrencyResident, personId,
    documents
  } = req.body;

  // MDM FIO Logic: If individual, concatenate name
  if (['private', 'self', 'ip', 'individual'].includes(legalForm) || ['private', 'individual'].includes(legalEntityType)) {
    if (lastName || firstName) {
      const builtName = [lastName, firstName, middleName].filter(Boolean).join(' ');
      if (!name) name = builtName;
      if (!fullName) fullName = builtName;
      req.body.name = name;
      req.body.fullName = fullName;
    }
  }

  // ВАЛИДАЦИЯ: проверяем входящие данные
  const validation = await validateCreateRequest(req.body);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: 'Ошибка валидации',
      errors: validation.errors
    });
  }

  const isEmployee = await checkIsEmployee(type);

  const { rows } = await db.query(
    `INSERT INTO contractors (
        name, full_name, status, phone, manager, inn, kpp, ogrn,
        legal_form, legal_entity_type, type, currency, registration_date, director, director_position,
        legal_address, notes, is_employee, tax_regime_id, group_id,
        email, website, okved, okved_name, authorized_capital, is_active,
        gender, passport_series, passport_number, passport_issued_by, passport_issued_date, passport_unit_code, registration_address,
        okpo, okato,
        last_name, first_name, middle_name, snils, citizenship, country_code, registration_number, tax_id, kio, is_currency_resident, person_id
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46)
     RETURNING *`,
    [
      name, fullName, status, phone, manager, inn, kpp, ogrn,
      legalForm, legalEntityType, type, currency, registrationDate, director, directorPosition,
      legalAddress, notes, isEmployee,
      taxRegimeId != null ? taxRegimeId : null,
      groupId || null,
      email || null, website || null, okved || null, okvedName || null,
      authorizedCapital != null ? authorizedCapital : null,
      isActive != null ? isActive : null,
      gender || null, passportSeries || null, passportNumber || null, passportIssuedBy || null, passportIssuedDate || null, passportUnitCode || null, registrationAddress || null,
      okpo || null, okato || null,
      lastName || null, firstName || null, middleName || null, snils || null, citizenship || null, countryCode || null, registrationNumber || null, taxId || null, kio || null, isCurrencyResident !== undefined ? isCurrencyResident : true, personId || null
    ]
  );
  
  const contractor = rows[0];
  const contractorId = contractor.id;

  if (tags && tags.length > 0) {
    const uniqueTags = [...new Set(tags)];
    for (const tagIdentifier of uniqueTags) {
      // Пытаемся найти тег в справочнике по ID или по имени
      const { rows: existing } = await db.query(
        'SELECT id FROM defined_tags WHERE (id = $1 OR name = $1) AND module = $2',
        [tagIdentifier, 'contractors']
      );

      let tagId;
      if (existing.length > 0) {
        tagId = existing[0].id;
      } else {
        // Если тега нет — создаем его (поддержка "создания на лету")
        const { rows: created } = await db.query(
          'INSERT INTO defined_tags (id, name, color, module) VALUES ($1, $1, $2, $3) RETURNING id',
          [tagIdentifier, '#3B82F6', 'contractors']
        );
        tagId = created[0].id;
      }

      await db.query(
        'INSERT INTO contractor_tags (contractor_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [contractorId, String(tagId)]
      );
    }
  }

  if (bankAccounts && bankAccounts.length > 0) {
    for (const bank of bankAccounts) {
      await db.query(
        `INSERT INTO contractor_bank_accounts (id, contractor_id, bank_name, bik, account_number, correspondent_account, currency, is_primary, swift, account_purpose, iban, bank_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [bank.id || 'ba-' + Math.random(), contractorId, bank.bankName, bank.bik, bank.accountNumber, bank.correspondentAccount, bank.currency, bank.isPrimary || false, bank.swift || null, bank.accountPurpose || null, bank.iban || null, bank.bankAddress || null]
      );
    }
  }

  if (contacts && contacts.length > 0) {
    for (const contact of contacts) {
      await db.query(
        `INSERT INTO contractor_contacts (id, contractor_id, name, position, phone, email, is_primary, person_id, authority_type, authority_document, work_phone, work_email)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [contact.id || 'cc-' + Math.random(), contractorId, contact.name, contact.position, contact.phone, contact.email, contact.isPrimary || false, contact.personId || null, contact.authorityType || null, contact.authorityDocument || null, contact.workPhone || null, contact.workEmail || null]
      );
    }
  }

  if (documents && documents.length > 0) {
    for (const doc of documents) {
      await db.query(
        `INSERT INTO contractor_documents (contractor_id, type, series, number, issue_date, expiry_date, issued_by, department_code, is_primary, scan_copy_path)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [contractorId, doc.type, doc.series || null, doc.number, doc.issueDate || null, doc.expiryDate || null, doc.issuedBy || null, doc.departmentCode || null, doc.isPrimary || false, doc.scanCopyPath || null]
      );
    }
  }

  // ОПТИМИЗАЦИЯ: батч-загрузка вместо старых функций
  const enrichedContractors = await loadFullContractorsData([contractor]);
  const enrichedContractor = enrichedContractors[0];

  // Log action
  await logAction({
    userId: req.headers['x-user-id'],
    action: 'CREATE',
    entityType: 'contractor',
    entityId: contractorId,
    newData: enrichedContractor,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  // If taxRegimeId is set on creation, log it to history
  if (taxRegimeId != null) {
    try {
      await contractorTaxService.setTaxRegime(contractorId, taxRegimeId, {
        reason: 'Указано при создании',
        changedBy: req.headers['x-user-id'] || 'system'
      });
    } catch (e) {
      console.error('Failed to log tax regime on creation', e);
    }
  }

  sendCreated(res, enrichedContractor);
}

/**
 * Обновить контрагента
 * @route PUT /api/contractors/:id
 * 
 * Валидация: INN/KPP/OGRN должны быть корректными, проверка дубликатов
 */
async function update(req, res) {
  try {
    const { id } = req.params;
  
  // Извлекаем нужные поля для логики MDM FIO до валидации
  const { legalForm, legalEntityType, lastName, firstName, middleName } = req.body;
  let { name, fullName } = req.body;

  // MDM FIO Logic: If individual, concatenate name
  if (['private', 'self', 'ip', 'individual'].includes(legalForm) || ['private', 'individual'].includes(legalEntityType) || req.body.groupId === 'private') {
    if (lastName || firstName) {
      const builtName = [lastName, firstName, middleName].filter(Boolean).join(' ');
      
      // Формируем краткое имя (Иванов И. И.)
      let shortName = lastName || '';
      if (firstName) {
        shortName += ` ${firstName.charAt(0)}.`;
      }
      if (middleName) {
        shortName += ` ${middleName.charAt(0)}.`;
      }
      
      if (!name) name = shortName || builtName;
      if (!fullName) fullName = builtName;
      req.body.name = name;
      req.body.fullName = fullName;
    }
  }

  // ВАЛИДАЦИЯ: проверяем входящие данные
  const validation = await validateUpdateRequest(req.body, id);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: 'Ошибка валидации',
      errors: validation.errors
    });
  }

  // Fetch old data for logging
  const { rows: oldRows } = await db.query('SELECT * FROM contractors WHERE id = $1', [id]);
  if (oldRows.length === 0) return sendNotFound(res, 'Contractor not found');
  
  // ОПТИМИЗАЦИЯ: батч-загрузка для получения старых данных
  const oldEnriched = await loadFullContractorsData(oldRows);
  const oldContractor = oldEnriched[0];

  const { status, phone, manager, inn, kpp, ogrn,
    currency, registrationDate, director, directorPosition,
    legalAddress, notes, taxRegimeId, groupId, type,
    email, website, okved, okvedName, authorizedCapital, isActive,
    gender, passportSeries, passportNumber, passportIssuedBy, passportIssuedDate, passportUnitCode, registrationAddress,
    okpo, okato,
    tags, bankAccounts, contacts,
    snils, citizenship, countryCode, registrationNumber, taxId, kio, isCurrencyResident, personId,
    documents
  } = req.body;

  const isEmployee = await checkIsEmployee(type);

  const { rows } = await db.query(
    `UPDATE contractors SET
        name=$1, full_name=$2, status=$3, phone=$4, manager=$5, inn=$6, kpp=$7, ogrn=$8,
        legal_form=$9, legal_entity_type=$10, type=$11, currency=$12, registration_date=$13, director=$14, director_position=$15,
        legal_address=$16, notes=$17, is_employee=$18, tax_regime_id=$19, group_id=$20,
        email=$21, website=$22, okved=$23, okved_name=$24, authorized_capital=$25, is_active=$26,
        gender=$27, passport_series=$28, passport_number=$29, passport_issued_by=$30, passport_issued_date=$31, passport_unit_code=$32, registration_address=$33,
        okpo=$34, okato=$35,
        last_name=$36, first_name=$37, middle_name=$38, snils=$39, citizenship=$40, country_code=$41, registration_number=$42, tax_id=$43, kio=$44, is_currency_resident=$45, person_id=$46
     WHERE id=$47
     RETURNING *`,
    [
      name, fullName, status, phone, manager, inn, kpp, ogrn,
      legalForm, legalEntityType, type, currency, registrationDate, director, directorPosition,
      legalAddress, notes, isEmployee,
      taxRegimeId != null ? taxRegimeId : null,
      groupId || null,
      email || null, website || null, okved || null, okvedName || null,
      authorizedCapital != null ? authorizedCapital : null,
      isActive != null ? isActive : null,
      gender || null, passportSeries || null, passportNumber || null, passportIssuedBy || null, passportIssuedDate || null, passportUnitCode || null, registrationAddress || null,
      okpo || null, okato || null,
      lastName || null, firstName || null, middleName || null, snils || null, citizenship || null, countryCode || null, registrationNumber || null, taxId || null, kio || null, isCurrencyResident !== undefined ? isCurrencyResident : true, personId || null,
      id
    ]
  );

  if (rows.length === 0) return sendNotFound(res, 'Contractor not found');

  await db.query('DELETE FROM contractor_tags WHERE contractor_id = $1', [id]);
  if (tags && tags.length > 0) {
    for (const tagIdentifier of [...new Set(tags)]) {
      const { rows: existing } = await db.query(
        'SELECT id FROM defined_tags WHERE (id = $1 OR name = $1) AND module = $2',
        [tagIdentifier, 'contractors']
      );

      let tagId;
      if (existing.length > 0) {
        tagId = existing[0].id;
      } else {
        const { rows: created } = await db.query(
          'INSERT INTO defined_tags (id, name, color, module) VALUES ($1, $1, $2, $3) RETURNING id',
          [tagIdentifier, '#3B82F6', 'contractors']
        );
        tagId = created[0].id;
      }

      await db.query(
        'INSERT INTO contractor_tags (contractor_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [id, String(tagId)]
      );
    }
  }

  await db.query('DELETE FROM contractor_bank_accounts WHERE contractor_id = $1', [id]);
  if (bankAccounts && bankAccounts.length > 0) {
    for (const bank of bankAccounts) {
      await db.query(
        `INSERT INTO contractor_bank_accounts (id, contractor_id, bank_name, bik, account_number, correspondent_account, currency, is_primary)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [bank.id || 'ba-' + Math.random(), id, bank.bankName, bank.bik, bank.accountNumber, bank.correspondentAccount, bank.currency, bank.isPrimary || false]
      );
    }
  }

  await db.query('DELETE FROM contractor_contacts WHERE contractor_id = $1', [id]);
  if (contacts && contacts.length > 0) {
    for (const contact of contacts) {
      await db.query(
        `INSERT INTO contractor_contacts (id, contractor_id, name, position, phone, email, is_primary, person_id, authority_type, authority_document, work_phone, work_email)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [contact.id || 'cc-' + Math.random(), id, contact.name, contact.position, contact.phone, contact.email, contact.isPrimary || false, contact.personId || null, contact.authorityType || null, contact.authorityDocument || null, contact.workPhone || null, contact.workEmail || null]
      );
    }
  }

  await db.query('DELETE FROM contractor_documents WHERE contractor_id = $1', [id]);
  if (documents && documents.length > 0) {
    for (const doc of documents) {
      await db.query(
        `INSERT INTO contractor_documents (contractor_id, type, series, number, issue_date, expiry_date, issued_by, department_code, is_primary, scan_copy_path)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [id, doc.type, doc.series || null, doc.number, doc.issueDate || null, doc.expiryDate || null, doc.issuedBy || null, doc.departmentCode || null, doc.isPrimary || false, doc.scanCopyPath || null]
      );
    }
  }

  // ОПТИМИЗАЦИЯ: батч-загрузка вместо старых функций
  const enrichedContractors = await loadFullContractorsData(rows);
  const enrichedContractor = enrichedContractors[0];

  // Log action
  await logAction({
    userId: req.headers['x-user-id'],
    action: 'UPDATE',
    entityType: 'contractor',
    entityId: id,
    oldData: oldContractor,
    newData: enrichedContractor,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  // If taxRegimeId changed, log it to history
  if (taxRegimeId !== undefined && oldContractor.tax_regime_id !== taxRegimeId) {
    try {
      await contractorTaxService.setTaxRegime(id, taxRegimeId, {
        reason: 'Изменено в общих настройках',
        changedBy: req.headers['x-user-id'] || null
      });
    } catch (e) {
      console.error('Failed to log tax regime on update', e);
    }
  }

  sendSuccess(res, enrichedContractor);
  } catch (error) {
    console.error(`Error updating contractor ${req.params.id}:`, error);
    sendValidationError(res, error.message || 'Failed to update contractor');
  }
}

/**
 * Удалить контрагента
 * @route DELETE /api/contractors/:id
 */
async function remove(req, res) {
  const { id } = req.params;
  
  // Fetch old data for logging
  const { rows: oldRows } = await db.query('SELECT * FROM contractors WHERE id = $1', [id]);
  if (oldRows.length > 0) {
    const oldRelations = await loadContractorRelations(id);
    const oldContractor = { ...oldRows[0], ...oldRelations };

    // Log action
    await logAction({
      userId: req.headers['x-user-id'],
      action: 'DELETE',
      entityType: 'contractor',
      entityId: id,
      oldData: oldContractor,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  }

  await db.query('UPDATE contractors SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
  sendDeleted(res);
}

/**
 * Массовое удаление контрагентов
 * @route POST /api/contractors/bulk-delete
 */
async function bulkDelete(req, res) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'ids must be a non-empty array' 
    });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Удалить связанные данные (теги, счета, контакты)
    await client.query('DELETE FROM contractor_tags WHERE contractor_id = ANY($1::int[])', [ids]);
    await client.query('DELETE FROM contractor_bank_accounts WHERE contractor_id = ANY($1::int[])', [ids]);
    await client.query('DELETE FROM contractor_contacts WHERE contractor_id = ANY($1::int[])', [ids]);

    // Удалить самих контрагентов
    const { rows: deleted } = await client.query(
      'UPDATE contractors SET deleted_at = CURRENT_TIMESTAMP WHERE id = ANY($1::int[]) RETURNING id',
      [ids]
    );

    await client.query('COMMIT');

    // Log actions
    for (const id of ids) {
      await logAction({
        userId: req.headers['x-user-id'],
        action: 'DELETE',
        entityType: 'contractor',
        entityId: id,
        oldData: { id },
        newData: null,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }

    sendSuccess(res, {
      deletedCount: deleted.length,
      deletedIds: deleted.map(r => r.id)
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Массовое обновление контрагентов
 */
async function bulkUpdate(req, res) {
  const { ids, updates } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids required' });

  const allowedKeys = ['status', 'type', 'legal_form', 'manager', 'tax_regime_id', 'group_id'];
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const setClauses = [];
    const values = [];
    let idx = 1;
    
    if (updates) {
      for (const key of Object.keys(updates)) {
        if (key === 'tags') continue;
        const dbKey = key === 'legalForm' ? 'legal_form' : key === 'taxRegimeId' ? 'tax_regime_id' : key === 'groupId' ? 'group_id' : key;
        if (!allowedKeys.includes(dbKey)) continue;
        setClauses.push(`${dbKey} = $${idx}`);
        values.push(updates[key]);
        idx++;
      }
    }

    if (setClauses.length > 0) {
      values.push(ids);
      await client.query(`UPDATE contractors SET ${setClauses.join(', ')} WHERE id = ANY($${idx}::int[])`, values);
    }

    if (updates && updates.tags !== undefined) {
      const tagsArray = Array.isArray(updates.tags) ? updates.tags : (typeof updates.tags === 'string' ? updates.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
      const uniqueTags = [...new Set(tagsArray)];
      
      for (const id of ids) {
        await client.query('DELETE FROM contractor_tags WHERE contractor_id = $1', [id]);
        for (const tagIdentifier of uniqueTags) {
          const { rows: existing } = await client.query(
            'SELECT id FROM defined_tags WHERE (id = $1 OR name = $1) AND module = $2',
            [tagIdentifier, 'contractors']
          );

          let tagId;
          if (existing.length > 0) {
            tagId = existing[0].id;
          } else {
            const { rows: created } = await client.query(
              'INSERT INTO defined_tags (id, name, color, module) VALUES ($1, $1, $2, $3) RETURNING id',
              [tagIdentifier, '#3B82F6', 'contractors']
            );
            tagId = created[0].id;
          }

          await client.query(
            'INSERT INTO contractor_tags (contractor_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, String(tagId)]
          );
        }
      }
    }
    await client.query('COMMIT');

    // ОПТИМИЗАЦИЯ: батч-загрузка вместо старых функций
    const { rows: updated } = await db.query('SELECT * FROM contractors WHERE id = ANY($1::int[])', [ids]);
    const enrichedUpdated = await loadFullContractorsData(updated);
    sendSuccess(res, enrichedUpdated);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getActivity(req, res) {
  const { id } = req.params;
  const { rows } = await db.query(
    `SELECT a.*, u.name as user_name 
     FROM audit_log a
     LEFT JOIN users u ON a.user_id = CAST(u.id AS VARCHAR)
     WHERE a.entity_type = 'contractor' AND a.entity_id = $1
     ORDER BY a.created_at DESC`,
    [id]
  );
  sendSuccess(res, rows);
}

async function removeActivity(req, res) {
  const { id, activityId } = req.params;
  await db.query(
    'DELETE FROM audit_log WHERE id = $1 AND entity_type = $2 AND entity_id = $3',
    [activityId, 'contractor', id]
  );
  sendDeleted(res);
}

async function getActivityChart(req, res) {
  const { id } = req.params;
  
  const query = `
    SELECT 
      TO_CHAR(created_at, 'Mon') as name,
      COUNT(*) as value
    FROM audit_log
    WHERE entity_type = 'contractor' AND entity_id = $1
    GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
    ORDER BY EXTRACT(MONTH FROM created_at) DESC
    LIMIT 6
  `;
  
  const { rows } = await db.query(query, [id]);
  // Reverse to get chronological order
  const chartData = rows.reverse().map(row => ({
    name: row.name,
    value: Number(row.value)
  }));
  
  sendSuccess(res, chartData);
}

module.exports = { getAll, getById, create, update, convert, remove, bulkUpdate, bulkDelete, getActivity, removeActivity, getActivityChart };
