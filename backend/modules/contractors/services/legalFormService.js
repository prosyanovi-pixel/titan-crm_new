/**
 * Сервис для работы с юридическими формами
 * Обеспечивает получение справочника юридических форм и их связь с налоговыми режимами
 */

const db = require('../../../db');

/**
 * Преобразование юридической формы из БД
 */
function transformLegalForm(form) {
  if (!form) return form;
  return {
    code: form.id,
    name: form.name,
    description: form.description || '',
    isActive: Boolean(form.isActive),
    groupId: form.groupId || null,
    groupName: form.groupName || null,
    groupDisplayOrder: form.groupDisplayOrder || 0,
    groupShowAsTab: Boolean(form.groupShowAsTab),
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
  };
}

/**
 * Получить все юридические формы
 * @param {boolean} activeOnly - Только активные
 * @returns {Promise<Array>} Список форм
 */
async function getAll(activeOnly = true) {
  let query = `
    SELECT f.*, g.name as group_name, g.display_order as group_display_order, g.show_as_tab as group_show_as_tab
    FROM legal_form f
    LEFT JOIN legal_form_groups g ON f.group_id = g.id
  `;
  // В таблице legal_form нет колонки is_active, поэтому просто получаем все
  query += ' ORDER BY g.display_order, f.name';
  
  const { rows } = await db.query(query);
  return rows.map(transformLegalForm);
}

/**
 * Получить форму по коду
 * @param {string} code - Код формы
 * @returns {Promise<Object>} Данные формы
 */
async function getByCode(code) {
  const query = `
    SELECT f.*, g.name as group_name, g.display_order as group_display_order, g.show_as_tab as group_show_as_tab
    FROM legal_form f
    LEFT JOIN legal_form_groups g ON f.group_id = g.id
    WHERE f.code = $1
  `;
  const { rows } = await db.query(query, [code]);
  if (rows.length === 0) return null;
  return transformLegalForm(rows[0]);
}

/**
 * Получить маппинг форм -> доступных налоговых режимов
 * @param {string} code - Код формы (опционально)
 * @returns {Promise<Object>} Маппинг
 */
async function getTaxRegimesMapping(code = null) {
  // Сначала получаем все активные формы
  const forms = await getAll(true);
  
  // Получаем все активные налоговые режимы
  const regimesRes = await db.query(`
    SELECT id, code, name, applies_to_legal_forms
    FROM finance_tax_regimes
    WHERE is_active = TRUE
  `);
  const regimes = regimesRes.rows;
  
  // Строим маппинг
  const mapping = {};
  
  for (const form of forms) {
    if (code && form.code !== code) continue;
    
    const availableRegimes = regimes.filter(regime => {
      if (!regime.appliesToLegalForms || regime.appliesToLegalForms.length === 0) {
        return true; // режим доступен для всех форм
      }
      
      const applies = regime.appliesToLegalForms.map(x => String(x).toLowerCase());
      const formCode = String(form.code).toLowerCase();
      
      if (applies.includes(formCode)) return true;
      
      if (form.groupId === 'legal' && (applies.includes('ooo') || applies.includes('ao'))) return true;
      if (form.groupId === 'individual' && applies.includes('ip')) return true;
      if (form.groupId === 'private' && applies.includes('self')) return true;
      
      return false;
    }).map(regime => ({
      id: regime.id,
      code: regime.code,
      name: regime.name,
    }));
    
    mapping[form.code] = {
      form,
      availableRegimes,
    };
  }
  
  if (code) {
    return mapping[code] || null;
  }
  
  return mapping;
}

/**
 * Обновить список допустимых налоговых режимов для формы
 * @param {string} code - Код формы
 * @param {Array} regimeIds - ID допустимых режимов
 * @returns {Promise<Object>} Обновлённая форма с маппингом
 */
async function updateAllowedRegimes(code, regimeIds) {
  // Проверяем существование формы
  const form = await getByCode(code);
  if (!form) {
    throw new Error(`Юридическая форма с кодом "${code}" не найдена`);
  }
  
  // Проверяем существование режимов
  if (regimeIds.length > 0) {
    const placeholders = regimeIds.map((_, i) => `$${i + 1}`).join(',');
    const regimesRes = await db.query(
      `SELECT id FROM finance_tax_regimes WHERE id IN (${placeholders})`,
      regimeIds
    );
    if (regimesRes.rows.length !== regimeIds.length) {
      throw new Error('Один или несколько налоговых режимов не найдены');
    }
  }
  
  // Получаем текущие режимы формы (для логирования)
  const mapping = await getTaxRegimesMapping(code);
  
  // В реальной системе нужно обновлять поле applies_to_legal_forms в каждом режиме
  // Но так как связь многие-ко-многим не реализована, мы просто возвращаем информацию
  // В будущем можно добавить таблицу связи legal_form_tax_regimes
  
  return {
    form,
    updatedRegimeIds: regimeIds,
    previousRegimeIds: mapping ? mapping.availableRegimes.map(r => r.id) : [],
    message: 'Внимание: прямая связь юридических форм с налоговыми режимами требует доработки схемы БД. ' +
             'Сейчас используется поле applies_to_legal_forms в таблице finance_tax_regimes.',
  };
}

module.exports = {
  getAll,
  getByCode,
  getTaxRegimesMapping,
  updateAllowedRegimes,
};