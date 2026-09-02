const BaseDataProvider = require('./BaseDataProvider');
const db = require('../../../../db');

class QuoteDataProvider extends BaseDataProvider {
  static getAvailableFields() {
    return [
      ...super.getGlobalFields(),
      { key: 'QUOTE_NUMBER', name: 'Номер КП', type: 'string', description: 'Номер коммерческого предложения' },
      { key: 'QUOTE_DATE', name: 'Дата КП', type: 'date', description: 'Дата коммерческого предложения' },
      { key: 'QUOTE_VALID_UNTIL', name: 'Действительно до', type: 'date', description: 'Дата действия КП' },
      { key: 'QUOTE_AMOUNT', name: 'Сумма КП', type: 'number', description: 'Итоговая сумма' },
      { key: 'QUOTE_TAX', name: 'Сумма налога (НДС)', type: 'number', description: 'Сумма налога' },
      { key: 'QUOTE_DISCOUNT', name: 'Сумма скидки', type: 'number', description: 'Сумма скидки' },
      { key: 'QUOTE_NOTES', name: 'Примечания', type: 'string', description: 'Заметки к КП' },
      { key: 'QUOTE_ITEMS_HTML', name: 'Таблица позиций (HTML)', type: 'html', description: 'Сгенерированная HTML-таблица со списком товаров/услуг' },
      { key: 'CONTRACTOR_NAME', name: 'Название контрагента', type: 'string', description: 'Название компании клиента' },
      { key: 'CONTRACTOR_FULL_NAME', name: 'Полное название контрагента', type: 'string', description: 'Полное название компании' },
      { key: 'CONTRACTOR_INN', name: 'ИНН контрагента', type: 'string', description: 'ИНН компании' },
      { key: 'CONTRACTOR_KPP', name: 'КПП контрагента', type: 'string', description: 'КПП компании' },
      { key: 'CONTRACTOR_OGRN', name: 'ОГРН контрагента', type: 'string', description: 'ОГРН компании' },
      { key: 'CONTRACTOR_LEGAL_ADDRESS', name: 'Юр. адрес контрагента', type: 'string', description: 'Юридический адрес' },
      { key: 'CONTRACTOR_DIRECTOR', name: 'Директор контрагента', type: 'string', description: 'ФИО директора' },
      { key: 'CONTRACTOR_DIRECTOR_POSITION', name: 'Должность директора', type: 'string', description: 'Должность директора' },
      { key: 'CONTRACTOR_PHONE', name: 'Телефон контрагента', type: 'string', description: 'Телефон' },
      { key: 'CONTRACTOR_EMAIL', name: 'Email контрагента', type: 'string', description: 'Email' }
    ];
  }

  async fetchData() {
    // Получаем само КП и связанного контрагента
    const result = await db.query(`
      SELECT q.*, 
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
      FROM quotes q
      LEFT JOIN contractors ct ON q.contractor_id = ct.id
      WHERE q.id = $1
    `, [this.entityId]);

    const quote = result.rows[0];
    if (!quote) {
      throw new Error(`КП с ID ${this.entityId} не найдено`);
    }

    // Получаем позиции КП
    const itemsResult = await db.query(`
      SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY id ASC
    `, [this.entityId]);
    
    const items = itemsResult.rows || [];

    // Генерируем HTML таблицу для позиций
    let itemsHtml = '';
    if (items.length > 0) {
      itemsHtml = `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">№</th>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Наименование</th>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: right;">Кол-во</th>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: right;">Цена (₽)</th>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: right;">Скидка (%)</th>
              <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: right;">Сумма (₽)</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, index) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.name || '—'}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.quantity || 0}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${Number(item.price || 0).toLocaleString('ru-RU')}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.discount_percent || 0}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${Number(item.total || 0).toLocaleString('ru-RU')}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">Итого:</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">${Number(quote.total_amount || 0).toLocaleString('ru-RU')}</td>
            </tr>
            ${quote.tax_amount > 0 ? `
            <tr>
              <td colspan="5" style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold; color: #666;">В том числе НДС:</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold; color: #666;">${Number(quote.tax_amount).toLocaleString('ru-RU')}</td>
            </tr>
            ` : ''}
          </tfoot>
        </table>
      `;
    }

    return {
      ...this.getGlobalData(),
      QUOTE_NUMBER: quote.number || quote.id,
      QUOTE_DATE: quote.date ? new Date(quote.date).toLocaleDateString('ru-RU') : '',
      QUOTE_VALID_UNTIL: quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('ru-RU') : 'Бессрочно',
      QUOTE_AMOUNT: quote.total_amount || 0,
      QUOTE_TAX: quote.tax_amount || 0,
      QUOTE_DISCOUNT: quote.discount_amount || 0,
      QUOTE_NOTES: quote.notes || '',
      QUOTE_ITEMS_HTML: itemsHtml,
      CONTRACTOR_NAME: quote.contractor_name || 'Частное лицо',
      CONTRACTOR_FULL_NAME: quote.contractor_full_name || '',
      CONTRACTOR_INN: quote.contractor_inn || '',
      CONTRACTOR_KPP: quote.contractor_kpp || '',
      CONTRACTOR_OGRN: quote.contractor_ogrn || '',
      CONTRACTOR_LEGAL_ADDRESS: quote.contractor_legal_address || '',
      CONTRACTOR_DIRECTOR: quote.contractor_director || '',
      CONTRACTOR_DIRECTOR_POSITION: quote.contractor_director_position || '',
      CONTRACTOR_PHONE: quote.contractor_phone || '',
      CONTRACTOR_EMAIL: quote.contractor_email || ''
    };
  }
}

module.exports = QuoteDataProvider;
