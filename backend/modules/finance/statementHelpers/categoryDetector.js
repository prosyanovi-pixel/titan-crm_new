/**
 * Определение категории финансовой операции
 * Файл: routes/finance/statementHelpers/categoryDetector.js
 */

/**
 * Автоматически определяет категорию финансовой операции по назначению платежа
 * @param {string} purpose - Назначение платежа
 * @param {string} direction - Направление ('credit' или 'debit')
 * @param {string} counterparty - Контрагент
 * @returns {string|null} - ID категории или null
 */
function detectCategory(purpose, direction, counterparty) {
  const p = (purpose || '').toLowerCase();
  const cp = (counterparty || '').toLowerCase();

  // Приходы (credit)
  if (direction === 'credit') {
    if (p.includes('оплата') || p.includes('за услуги') || p.includes('по договору') ||
        p.includes('аванс') || p.includes('предоплата') || p.includes('поступление')) {
      return 'inc_clients';
    }
    return 'inc_other';
  }

  // Расходы (debit)
  
  // Налоги и сборы
  if (p.includes('ндс') || p.includes('ндфл') || p.includes('налог') ||
      p.includes('страховые взносы') || p.includes('страх. взнос') ||
      p.includes('взносы в') || p.includes('пфр') || p.includes('фсс') ||
      p.includes('ффомс') || p.includes('сфр') ||
      cp.includes('ифнс') || cp.includes('фнс') ||
      cp.includes('казначейство') || cp.includes('уфк') || cp.includes('осфр') ||
      p.includes('уплата налога') || p.includes('уплата сбора')) {
    return 'exp_taxes';
  }
  
  // Зарплата
  if (p.includes('зарплата') || p.includes('заработная плата') ||
      p.includes('зп ') || p.includes('выплата') || p.includes('аванс сотрудник') ||
      p.includes('оклад') || p.includes('командировочн') || p.includes('командировка')) {
    return 'exp_salary';
  }
  
  // Аренда
  if (p.includes('аренда') || p.includes('арендная плата') || p.includes('субаренда')) {
    return 'exp_rent';
  }
  
  // Закупки
  if (p.includes('запчасти') || p.includes('материалы') || p.includes('оборудование') ||
      p.includes('комплектующие') || p.includes('товар') || p.includes('поставка')) {
    return 'exp_purchase';
  }
  
  // Переоценка (не категоризируем)
  if (p.includes('переоценка') || p.includes('курсовая разница')) {
    return null;
  }
  
  // Прочие расходы
  return 'exp_other';
}

module.exports = {
  detectCategory,
};
