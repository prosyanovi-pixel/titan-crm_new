/**
 * Управление таблицами БД для модуля Legal Cases
 * Создание и проверка вспомогательных таблиц
 */

const db = require('../../../db');

let supportTablesEnsured = false;

/**
 * Создаёт вспомогательные таблицы если они не существуют
 * @returns {Promise<void>}
 */
const ensureLegalCaseSupportTables = async () => {
  if (supportTablesEnsured) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS case_events (
      id          VARCHAR(50) PRIMARY KEY,
      case_id     VARCHAR(50) NOT NULL,
      date        VARCHAR(50),
      type        VARCHAR(50),
      title       VARCHAR(255),
      description TEXT,
      author      VARCHAR(255),
      FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS case_third_parties (
      id      VARCHAR(50) PRIMARY KEY,
      case_id VARCHAR(50) NOT NULL,
      name    VARCHAR(255),
      role    VARCHAR(100),
      FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS case_recovered_items (
      id          VARCHAR(50) PRIMARY KEY,
      case_id     VARCHAR(50) NOT NULL,
      type        VARCHAR(100),
      amount      NUMERIC(15,2) DEFAULT 0,
      currency    VARCHAR(10) DEFAULT 'RUB',
      FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE CASCADE
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS case_expenses (
      id          VARCHAR(50) PRIMARY KEY,
      case_id     VARCHAR(50) NOT NULL,
      type        VARCHAR(100),
      performer   VARCHAR(255),
      amount      NUMERIC(15,2) DEFAULT 0,
      currency    VARCHAR(10) DEFAULT 'RUB',
      FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE CASCADE
    )
  `);

  supportTablesEnsured = true;
};

module.exports = {
  ensureLegalCaseSupportTables,
};
