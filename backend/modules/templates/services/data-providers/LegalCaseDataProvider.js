const BaseDataProvider = require('./BaseDataProvider');

class LegalCaseDataProvider extends BaseDataProvider {
  constructor(entityId) {
    super(entityId, 'legal_cases');
  }

  async fetchData() {
    const db = require('../../../../db');
    // Получаем дело и связанные сущности (истец, ответчик, суд и т.д.)
    const query = `
      SELECT 
        lc.id,
        lc.case_number as "caseNumber",
        cfd.claim_amount as "claimAmount",
        lc.description,
        lc.creation_date as "createdAt",
        lc.court_name as "courtName",
        '' as "courtAddress",
        lc.judge as "judgeName",
        lc.plaintiff as "plaintiffName",
        '' as "plaintiffInn",
        lc.defendant as "defendantName",
        '' as "defendantInn"
      FROM legal_cases lc
      LEFT JOIN case_financial_details cfd ON cfd.case_id = lc.id
      WHERE lc.id = $1
    `;
    
    const result = await db.query(query, [this.entityId]);
    if (!result.rows[0]) {
      throw new Error(`Судебное дело с ID ${this.entityId} не найдено`);
    }

    const data = result.rows[0];

    // Формируем плоский объект с переменными
    return {
      ...this.getGlobalData(),
      CASE_NUMBER: data.caseNumber || '',
      CLAIM_AMOUNT: data.claimAmount ? Number(data.claimAmount).toLocaleString('ru-RU') : '',
      DESCRIPTION: data.description || '',
      COURT_NAME: data.courtName || '',
      COURT_ADDRESS: data.courtAddress || '',
      JUDGE_NAME: data.judgeName || '',
      PLAINTIFF_NAME: data.plaintiffName || '',
      PLAINTIFF_INN: data.plaintiffInn || '',
      DEFENDANT_NAME: data.defendantName || '',
      DEFENDANT_INN: data.defendantInn || ''
    };
  }

  static getAvailableFields() {
    return [
      ...super.getGlobalFields(),
      { key: 'CASE_NUMBER', name: 'Номер судебного дела', type: 'string', description: 'Номер судебного дела' },
      { key: 'CLAIM_AMOUNT', name: 'Сумма иска', type: 'string', description: 'Сумма иска' },
      { key: 'DESCRIPTION', name: 'Описание дела', type: 'string', description: 'Описание дела' },
      { key: 'COURT_NAME', name: 'Название суда', type: 'string', description: 'Название суда' },
      { key: 'COURT_ADDRESS', name: 'Адрес суда', type: 'string', description: 'Адрес суда' },
      { key: 'JUDGE_NAME', name: 'ФИО судьи', type: 'string', description: 'ФИО судьи' },
      { key: 'PLAINTIFF_NAME', name: 'Истец', type: 'string', description: 'Истец (название/ФИО)' },
      { key: 'PLAINTIFF_INN', name: 'ИНН истца', type: 'string', description: 'ИНН истца' },
      { key: 'DEFENDANT_NAME', name: 'Ответчик', type: 'string', description: 'Ответчик (название/ФИО)' },
      { key: 'DEFENDANT_INN', name: 'ИНН ответчика', type: 'string', description: 'ИНН ответчика' }
    ];
  }
}

module.exports = LegalCaseDataProvider;
