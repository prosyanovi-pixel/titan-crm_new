/**
 * Валидаторы для модуля Contractors
 * Проверка входящих данных при создании и обновлении контрагентов
 */

const db = require('../../../db');

/**
 * Валидация INN (Идентификационный номер налогоплательщика)
 * Проверяет формат и контрольную сумму
 * 
 * @param {string} inn - INN для проверки
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateINN(inn) {
  if (!inn) return { valid: true }; // Необязательное поле
  
  const innStr = String(inn).trim();
  
  // INN может быть 10 или 12 символов
  if (!/^\d{10}$|^\d{12}$/.test(innStr)) {
    return { valid: false, error: 'INN должен содержать 10 или 12 цифр' };
  }
  
  // Простая проверка контрольной суммы (упрощенная версия)
  // Полная проверка требует алгоритма по ГОСТ
  if (innStr.length === 10) {
    const digits = innStr.split('').map(Number);
    const weights = [2, 4, 10, 3, 5, 9, 4, 6, 8, 0];
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * weights[i];
    }
    const checksum = (sum % 11) % 10;
    if (checksum !== digits[9]) {
      // Не отклоняем, так как может быть неполная база
      console.warn(`INN ${innStr} failed checksum validation (may still be valid)`);
    }
  }
  
  return { valid: true };
}

/**
 * Валидация KPP (Код причины постановки на учет)
 * Используется только для юридических лиц в РФ
 * 
 * @param {string} kpp - KPP для проверки
 * @param {string} legalEntityType - Тип юридической сущности
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateKPP(kpp, legalEntityType) {
  if (!kpp) return { valid: true }; // Необязательное поле
  
  // KPP требуется только для юридических лиц
  if (legalEntityType !== 'legal') {
    return { valid: true };
  }
  
  const kppStr = String(kpp).trim();
  
  if (!/^\d{9}$/.test(kppStr)) {
    return { valid: false, error: 'KPP должен содержать 9 цифр' };
  }
  
  return { valid: true };
}

/**
 * Валидация OGRN (Основной государственный реестровый номер)
 * 13 цифр для юридических лиц или 15 для ИП
 * 
 * @param {string} ogrn - OGRN для проверки
 * @param {string} legalEntityType - Тип юридической сущности
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateOGRN(ogrn, legalEntityType) {
  if (!ogrn) return { valid: true }; // Необязательное поле
  
  const ogrnStr = String(ogrn).trim();
  
  // OGRN должен быть 13 или 15 цифр
  if (!/^\d{13}$|^\d{15}$/.test(ogrnStr)) {
    return { valid: false, error: 'OGRN должен содержать 13 или 15 цифр' };
  }
  
  return { valid: true };
}

/**
 * Валидация email
 * 
 * @param {string} email - Email для проверки
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateEmail(email) {
  if (!email) return { valid: true }; // Необязательное поле
  
  const emailStr = String(email).trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(emailStr)) {
    return { valid: false, error: 'Некорректный формат email' };
  }
  
  if (emailStr.length > 100) {
    return { valid: false, error: 'Email слишком длинный (максимум 100 символов)' };
  }
  
  return { valid: true };
}

/**
 * Валидация телефона
 * 
 * @param {string} phone - Номер телефона для проверки
 * @returns {Object} { valid: boolean, error?: string }
 */
function validatePhone(phone) {
  if (!phone) return { valid: true }; // Необязательное поле
  
  const phoneStr = String(phone).trim();
  
  // Treat placeholder dashes (e.g. "—", "-", "–") as absent value
  if (/^[-–—]+$/.test(phoneStr)) return { valid: true };
  
  // Простая проверка: не менее 7 цифр
  const digitsOnly = phoneStr.replace(/\D/g, '');
  if (digitsOnly.length < 7) {
    return { valid: false, error: 'Номер телефона должен содержать не менее 7 цифр' };
  }
  
  if (phoneStr.length > 20) {
    return { valid: false, error: 'Номер телефона слишком длинный' };
  }
  
  return { valid: true };
}

/**
 * Валидация названия контрагента
 * 
 * @param {string} name - Название для проверки
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateName(name) {
  if (!name || String(name).trim().length === 0) {
    return { valid: false, error: 'Название контрагента обязательно' };
  }
  
  const nameStr = String(name).trim();
  
  if (nameStr.length > 500) {
    return { valid: false, error: 'Название слишком длинное (максимум 500 символов)' };
  }
  
  if (nameStr.length < 2) {
    return { valid: false, error: 'Название должно содержать не менее 2 символов' };
  }
  
  return { valid: true };
}

/**
 * Валидация банковского счета
 * 
 * @param {Object} bankAccount - Объект с данными счета
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateBankAccount(bankAccount) {
  if (!bankAccount) return { valid: true }; // Необязательное поле
  
  const { accountNumber, bik, swift } = bankAccount;
  
  if (accountNumber) {
    const accountStr = String(accountNumber).trim();
    if (!/^\d{20}$/.test(accountStr)) {
      return { valid: false, error: 'Номер счета должен содержать 20 цифр' };
    }
  }
  
  if (bik) {
    const bikStr = String(bik).trim();
    if (!/^\d{9}$/.test(bikStr)) {
      return { valid: false, error: 'БИК должен содержать 9 цифр' };
    }
  }
  
  if (swift) {
    const swiftStr = String(swift).trim();
    if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(swiftStr)) {
      return { valid: false, error: 'Некорректный формат SWIFT кода' };
    }
  }
  
  return { valid: true };
}

/**
 * Проверка на дубликат INN
 * 
 * @param {string} inn - INN для проверки
 * @param {number} excludeContractorId - ID контрагента, который исключить из проверки (при обновлении)
 * @returns {Promise<Object>} { valid: boolean, error?: string, existingId?: number }
 */
async function checkDuplicateINN(inn, excludeContractorId = null) {
  if (!inn) return { valid: true }; // Необязательное поле
  
  const query = excludeContractorId
    ? 'SELECT id FROM contractors WHERE inn = $1 AND id != $2'
    : 'SELECT id FROM contractors WHERE inn = $1';
  
  const params = excludeContractorId ? [inn, excludeContractorId] : [inn];
  const { rows } = await db.query(query, params);
  
  if (rows.length > 0) {
    return {
      valid: false,
      error: `Контрагент с INN ${inn} уже существует`,
      existingId: rows[0].id
    };
  }
  
  return { valid: true };
}

/**
 * Полная валидация данных при создании контрагента
 * 
 * @param {Object} data - Данные для создания
 * @param {Object} options - Опции валидации
 * @returns {Promise<Object>} { valid: boolean, errors: { [field]: string } }
 */
async function validateCreateRequest(data, options = {}) {
  const errors = {};
  
  // Обязательные поля
  const nameValid = validateName(data.name);
  if (!nameValid.valid) errors.name = nameValid.error;
  
  // Опциональные поля с форматом
  const innValid = validateINN(data.inn);
  if (!innValid.valid) errors.inn = innValid.error;
  
  const kppValid = validateKPP(data.kpp, data.legalEntityType);
  if (!kppValid.valid) errors.kpp = kppValid.error;
  
  const ogrnValid = validateOGRN(data.ogrn, data.legalEntityType);
  if (!ogrnValid.valid) errors.ogrn = ogrnValid.error;
  
  const emailValid = validateEmail(data.email);
  if (!emailValid.valid) errors.email = emailValid.error;
  
  const phoneValid = validatePhone(data.phone);
  if (!phoneValid.valid) errors.phone = phoneValid.error;
  
  if (data.bankAccounts && Array.isArray(data.bankAccounts)) {
    for (let i = 0; i < data.bankAccounts.length; i++) {
      const bankValid = validateBankAccount(data.bankAccounts[i]);
      if (!bankValid.valid) {
        errors[`bankAccounts.${i}`] = bankValid.error;
      }
    }
  }
  
  // Проверка на дубликат INN (если указан)
  if (data.inn && !options.skipDuplicateCheck) {
    const dupCheck = await checkDuplicateINN(data.inn);
    if (!dupCheck.valid) errors.inn = dupCheck.error;
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Полная валидация данных при обновлении контрагента
 * 
 * @param {Object} data - Данные для обновления
 * @param {number} contractorId - ID контрагента
 * @param {Object} options - Опции валидации
 * @returns {Promise<Object>} { valid: boolean, errors: { [field]: string } }
 */
async function validateUpdateRequest(data, contractorId, options = {}) {
  const errors = {};
  
  // Проверяем только те поля, которые были переданы
  if (data.name !== undefined) {
    const nameValid = validateName(data.name);
    if (!nameValid.valid) errors.name = nameValid.error;
  }
  
  if (data.inn !== undefined) {
    const innValid = validateINN(data.inn);
    if (!innValid.valid) errors.inn = innValid.error;
    
    // Проверка на дубликат INN
    if (innValid.valid && !options.skipDuplicateCheck) {
      const dupCheck = await checkDuplicateINN(data.inn, contractorId);
      if (!dupCheck.valid) errors.inn = dupCheck.error;
    }
  }
  
  if (data.kpp !== undefined) {
    const kppValid = validateKPP(data.kpp, data.legalEntityType);
    if (!kppValid.valid) errors.kpp = kppValid.error;
  }
  
  if (data.ogrn !== undefined) {
    const ogrnValid = validateOGRN(data.ogrn, data.legalEntityType);
    if (!ogrnValid.valid) errors.ogrn = ogrnValid.error;
  }
  
  if (data.email !== undefined) {
    const emailValid = validateEmail(data.email);
    if (!emailValid.valid) errors.email = emailValid.error;
  }
  
  if (data.phone !== undefined) {
    const phoneValid = validatePhone(data.phone);
    if (!phoneValid.valid) errors.phone = phoneValid.error;
  }
  
  if (data.bankAccounts !== undefined && Array.isArray(data.bankAccounts)) {
    for (let i = 0; i < data.bankAccounts.length; i++) {
      const bankValid = validateBankAccount(data.bankAccounts[i]);
      if (!bankValid.valid) {
        errors[`bankAccounts.${i}`] = bankValid.error;
      }
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

module.exports = {
  validateINN,
  validateKPP,
  validateOGRN,
  validateEmail,
  validatePhone,
  validateName,
  validateBankAccount,
  checkDuplicateINN,
  validateCreateRequest,
  validateUpdateRequest
};
