/**
 * Сервис управления профилем и счетами компании
 */

const db = require('../../../db');

/**
 * Получить профиль компании
 */
async function getProfile() {
  const { rows } = await db.query('SELECT * FROM company_profile ORDER BY id LIMIT 1');
  return rows[0] || {};
}

/**
 * Обновить профиль компании
 */
async function updateProfile(data) {
  const {
    full_name = '', short_name = '', legal_address = '', actual_address = '',
    inn = '', kpp = '', ogrn = '', bik = '',
    bank_account = '', corr_account = '', bank_name = '',
    phone = '', email = '', website = '', logo_url = '', tax_regime_id = null
  } = data;

  const { rows: existing } = await db.query('SELECT id FROM company_profile LIMIT 1');

  if (existing.length === 0) {
    const { rows } = await db.query(`
      INSERT INTO company_profile
        (full_name, short_name, legal_address, actual_address, inn, kpp, ogrn,
         bik, bank_account, corr_account, bank_name, phone, email, website, logo_url, tax_regime_id, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,CURRENT_TIMESTAMP)
      RETURNING *
    `, [full_name, short_name, legal_address, actual_address, inn, kpp, ogrn,
        bik, bank_account, corr_account, bank_name, phone, email, website, logo_url, tax_regime_id]);
    return rows[0];
  }

  const { rows } = await db.query(`
    UPDATE company_profile
    SET full_name=$1, short_name=$2, legal_address=$3, actual_address=$4,
        inn=$5, kpp=$6, ogrn=$7, bik=$8, bank_account=$9, corr_account=$10,
        bank_name=$11, phone=$12, email=$13, website=$14, logo_url=$15,
        tax_regime_id=$16, updated_at=CURRENT_TIMESTAMP
    WHERE id=$17
    RETURNING *
  `, [full_name, short_name, legal_address, actual_address, inn, kpp, ogrn,
      bik, bank_account, corr_account, bank_name, phone, email, website, logo_url, tax_regime_id,
      existing[0].id]);

  return rows[0];
}

/**
 * Получить все счета компании
 */
async function getAllAccounts() {
  const { rows } = await db.query(`
    SELECT a.*, c.name AS currency_name, c.symbol AS currency_symbol
    FROM company_accounts a
    LEFT JOIN currency c ON c.id = a.currency_id
    ORDER BY a.is_default DESC, a.id
  `);
  return rows;
}

/**
 * Добавить счет
 */
async function createAccount(data) {
  const {
    name, description = '', currency_id = 'RUB',
    account_type = 'bank', bank_name = '', account_number = '',
    is_default = false, is_active = true
  } = data;

  if (is_default) {
    await db.query('UPDATE company_accounts SET is_default=FALSE');
  }

  const { rows } = await db.query(`
    INSERT INTO company_accounts
      (name, description, currency_id, account_type, bank_name, account_number, is_default, is_active)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *
  `, [name.trim(), description, currency_id, account_type, bank_name, account_number, is_default, is_active]);

  return rows[0];
}

/**
 * Обновить счет
 */
async function updateAccount(id, data) {
  const {
    name, description = '', currency_id = 'RUB',
    account_type = 'bank', bank_name = '', account_number = '',
    is_default = false, is_active = true
  } = data;

  if (is_default) {
    await db.query('UPDATE company_accounts SET is_default=FALSE WHERE id!=$1', [id]);
  }

  const { rows } = await db.query(`
    UPDATE company_accounts
    SET name=$1, description=$2, currency_id=$3, account_type=$4,
        bank_name=$5, account_number=$6, is_default=$7, is_active=$8,
        updated_at=CURRENT_TIMESTAMP
    WHERE id=$9
    RETURNING *
  `, [name.trim(), description, currency_id, account_type, bank_name, account_number, is_default, is_active, id]);

  return rows[0] || null;
}

/**
 * Удалить счет
 */
async function deleteAccount(id) {
  const { rowCount } = await db.query('DELETE FROM company_accounts WHERE id=$1', [id]);
  return rowCount > 0;
}

module.exports = {
  getProfile,
  updateProfile,
  getAllAccounts,
  createAccount,
  updateAccount,
  deleteAccount
};
