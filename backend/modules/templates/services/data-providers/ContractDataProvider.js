const BaseDataProvider = require('./BaseDataProvider');
const db = require('../../../../db');

class ContractDataProvider extends BaseDataProvider {
  static getAvailableFields() {
    return [
      ...super.getGlobalFields(),
      { key: 'CONTRACT_NUMBER', name: 'Номер договора', type: 'string', description: 'Номер договора из карточки' },
      { key: 'CONTRACT_DATE', name: 'Дата договора', type: 'date', description: 'Дата заключения договора' },
      { key: 'CONTRACT_AMOUNT', name: 'Сумма договора', type: 'number', description: 'Сумма договора' },
      { key: 'CONTRACTOR_NAME', name: 'Название контрагента', type: 'string', description: 'Название компании контрагента' },
      { key: 'CONTRACTOR_FULL_NAME', name: 'Полное название контрагента', type: 'string', description: 'Полное название компании' },
      { key: 'CONTRACTOR_INN', name: 'ИНН контрагента', type: 'string', description: 'ИНН компании' },
      { key: 'CONTRACTOR_KPP', name: 'КПП контрагента', type: 'string', description: 'КПП компании' },
      { key: 'CONTRACTOR_OGRN', name: 'ОГРН контрагента', type: 'string', description: 'ОГРН компании' },
      { key: 'CONTRACTOR_LEGAL_ADDRESS', name: 'Юр. адрес контрагента', type: 'string', description: 'Юридический адрес' },
      { key: 'CONTRACTOR_DIRECTOR', name: 'Директор контрагента', type: 'string', description: 'ФИО директора' },
      { key: 'CONTRACTOR_DIRECTOR_POSITION', name: 'Должность директора', type: 'string', description: 'Должность директора' },
      { key: 'CONTRACTOR_PHONE', name: 'Телефон контрагента', type: 'string', description: 'Телефон' },
      { key: 'CONTRACTOR_EMAIL', name: 'Email контрагента', type: 'string', description: 'Email' },
      { key: 'HAS_AMOUNT', name: 'Сумма указана (условие)', type: 'boolean', description: 'Истина, если сумма > 0' },
      { key: 'IS_ACTIVE', name: 'Договор активен (условие)', type: 'boolean', description: 'Истина, если статус active' }
    ];
  }

  async fetchData() {
    // Получаем сам договор и связанного контрагента
    const result = await db.query(`
      SELECT c.*, 
             ct.name as contractor_name, 
             ct.full_name as contractor_full_name,
             ct.inn as contractor_inn,
             ct.kpp as contractor_kpp,
             ct.ogrn as contractor_ogrn,
             ct.legal_address as contractor_legal_address,
             ct.director as contractor_director,
             ct.director_position as contractor_director_position,
             ct.phone as contractor_phone,
             ct.email as contractor_email
      FROM contracts c
      LEFT JOIN contractors ct ON c.contractor_id = ct.id
      WHERE c.id = $1
    `, [this.entityId]);

    const contract = result.rows[0];
    if (!contract) {
      throw new Error(`Договор с ID ${this.entityId} не найден`);
    }

    return {
      ...this.getGlobalData(),
      CONTRACT_NUMBER: contract.contractNumber || contract.id,
      CONTRACT_DATE: contract.startDate ? new Date(contract.startDate).toLocaleDateString('ru-RU') : '',
      CONTRACT_AMOUNT: contract.amount || 0,
      CONTRACTOR_NAME: contract.contractorName || '',
      CONTRACTOR_FULL_NAME: contract.contractorFullName || '',
      CONTRACTOR_INN: contract.contractorInn || '',
      CONTRACTOR_KPP: contract.contractorKpp || '',
      CONTRACTOR_OGRN: contract.contractorOgrn || '',
      CONTRACTOR_LEGAL_ADDRESS: contract.contractorLegalAddress || '',
      CONTRACTOR_DIRECTOR: contract.contractorDirector || '',
      CONTRACTOR_DIRECTOR_POSITION: contract.contractorDirectorPosition || '',
      CONTRACTOR_PHONE: contract.contractorPhone || '',
      CONTRACTOR_EMAIL: contract.contractorEmail || '',
      HAS_AMOUNT: (contract.amount || 0) > 0,
      IS_ACTIVE: contract.status === 'active',
    };
  }
}

module.exports = ContractDataProvider;
