const BaseDataProvider = require('./BaseDataProvider');

class MailDataProvider extends BaseDataProvider {
  constructor(entityId) {
    // entityId is usually the Contractor ID that the email is being sent to.
    super(entityId, 'mail');
  }

  async fetchData() {
    const db = require('../../../../db');
    // Получаем данные получателя (контрагента)
    const query = `
      SELECT 
        c.name,
        c.full_name as "fullName",
        c.inn,
        c.kpp,
        c.email,
        c.phone
      FROM contractors c
      WHERE c.id = $1
    `;
    
    const result = await db.query(query, [this.entityId]);
    const data = result.rows[0] || {};

    return {
      RECIPIENT_NAME: data.name || '',
      RECIPIENT_FULL_NAME: data.fullName || '',
      RECIPIENT_INN: data.inn || '',
      RECIPIENT_EMAIL: data.email || '',
      RECIPIENT_PHONE: data.phone || '',
      CURRENT_DATE: new Date().toLocaleDateString('ru-RU'),
      CURRENT_TIME: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
  }

  static getAvailableFields() {
    return [
      ...super.getGlobalFields(),
      { key: 'RECIPIENT_NAME', name: 'Краткое наименование', type: 'string', description: 'Краткое наименование получателя' },
      { key: 'RECIPIENT_FULL_NAME', name: 'Полное наименование', type: 'string', description: 'Полное наименование получателя' },
      { key: 'RECIPIENT_INN', name: 'ИНН получателя', type: 'string', description: 'ИНН получателя' },
      { key: 'RECIPIENT_EMAIL', name: 'Email получателя', type: 'string', description: 'Email получателя' },
      { key: 'RECIPIENT_PHONE', name: 'Телефон получателя', type: 'string', description: 'Телефон получателя' },
      { key: 'CURRENT_DATE', name: 'Текущая дата', type: 'string', description: 'Текущая дата' },
      { key: 'CURRENT_TIME', name: 'Текущее время', type: 'string', description: 'Текущее время' }
    ];
  }
}

module.exports = MailDataProvider;
