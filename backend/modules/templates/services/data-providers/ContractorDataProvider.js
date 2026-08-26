const BaseDataProvider = require('./BaseDataProvider');
const db = require('../../../../db'); // Assuming db is at backend/db.js or backend/db/index.js

class ContractorDataProvider extends BaseDataProvider {
  constructor(entityId, moduleId = 'contractors') {
    super(entityId, moduleId);
  }

  static getAvailableFields() {
    return [
      ...super.getGlobalFields(),
      { key: 'NAME', name: 'Название', type: 'string', description: 'Название контрагента' },
      { key: 'INN', name: 'ИНН', type: 'string', description: 'ИНН' },
      { key: 'KPP', name: 'КПП', type: 'string', description: 'КПП' },
      { key: 'OGRN', name: 'ОГРН', type: 'string', description: 'ОГРН/ОГРНИП' },
      { key: 'EMAIL', name: 'Email', type: 'string', description: 'Email' },
      { key: 'PHONE', name: 'Телефон', type: 'string', description: 'Телефон' },
      { key: 'LEGAL_ADDRESS', name: 'Юридический адрес', type: 'string', description: 'Юридический адрес' },
      { key: 'FACT_ADDRESS', name: 'Фактический адрес', type: 'string', description: 'Фактический адрес' }
    ];
  }

  async fetchData() {
    const { rows } = await db.query(
      `SELECT * FROM contractors WHERE id = $1`,
      [this.entityId]
    );

    if (rows.length === 0) {
      throw new Error(`Контрагент с ID ${this.entityId} не найден`);
    }

    const contractor = rows[0];

    return {
      ...this.getGlobalData(),
      'NAME': contractor.name || '',
      'INN': contractor.inn || '',
      'KPP': contractor.kpp || '',
      'OGRN': contractor.ogrn || '',
      'EMAIL': contractor.email || '',
      'PHONE': contractor.phone || '',
      'LEGAL_ADDRESS': contractor.legal_address || '',
      'FACT_ADDRESS': contractor.fact_address || ''
    };
  }
}

module.exports = ContractorDataProvider;
