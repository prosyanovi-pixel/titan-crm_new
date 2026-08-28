-- ============================================================
-- MIGRATION: Company Profile, HR Structure, Employees
-- ============================================================

-- 1. Курсы валют и базовая валюта
ALTER TABLE currency 
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(15,6) DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_base BOOLEAN DEFAULT FALSE;

UPDATE currency SET is_base = TRUE, exchange_rate = 1 WHERE id = 'RUB';
UPDATE currency SET exchange_rate = 90.0 WHERE id = 'USD';
UPDATE currency SET exchange_rate = 97.0 WHERE id = 'EUR';
UPDATE currency SET exchange_rate = 12.5 WHERE id = 'CNY';
UPDATE currency SET exchange_rate = 114.0 WHERE id = 'GBP';

-- 2. Реквизиты компании
CREATE TABLE IF NOT EXISTS company_profile (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(500) DEFAULT '',
  short_name VARCHAR(255) DEFAULT '',
  legal_address TEXT DEFAULT '',
  actual_address TEXT DEFAULT '',
  inn VARCHAR(20) DEFAULT '',
  kpp VARCHAR(20) DEFAULT '',
  ogrn VARCHAR(20) DEFAULT '',
  bik VARCHAR(20) DEFAULT '',
  bank_account VARCHAR(30) DEFAULT '',
  corr_account VARCHAR(30) DEFAULT '',
  bank_name VARCHAR(255) DEFAULT '',
  phone VARCHAR(50) DEFAULT '',
  email VARCHAR(255) DEFAULT '',
  website VARCHAR(255) DEFAULT '',
  logo_url TEXT DEFAULT '',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO company_profile (full_name) 
  SELECT '' WHERE NOT EXISTS (SELECT 1 FROM company_profile);

-- 3. Счета компании
CREATE TABLE IF NOT EXISTS company_accounts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  currency_id VARCHAR(3) REFERENCES currency(id) ON DELETE RESTRICT,
  account_type VARCHAR(50) DEFAULT 'bank',
  bank_name VARCHAR(255) DEFAULT '',
  account_number VARCHAR(50) DEFAULT '',
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO company_accounts (name, currency_id, account_type, is_default)
  SELECT 'Расчётный счёт (RUB)', 'RUB', 'bank', TRUE
  WHERE NOT EXISTS (SELECT 1 FROM company_accounts);

-- 4. Должности
CREATE TABLE IF NOT EXISTS positions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  role VARCHAR(50) DEFAULT 'user',
  displayorder INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO positions (name, displayorder)
  SELECT * FROM (VALUES
  ('Директор', 1),
  ('Бухгалтер', 2),
  ('Менеджер', 3),
  ('Разработчик', 4),
  ('Юрист', 5)
  ) AS tmp(name, displayorder) WHERE NOT EXISTS (SELECT 1 FROM positions);

-- 5. Отделы (иерархия через parent_id)
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  parent_id INT REFERENCES departments(id) ON DELETE SET NULL,
  displayorder INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO departments (name, displayorder)
  SELECT * FROM (VALUES
  ('Администрация', 1),
  ('Отдел продаж', 2),
  ('IT-отдел', 3),
  ('Бухгалтерия', 4),
  ('Юридический отдел', 5)
  ) AS tmp(name, displayorder) WHERE NOT EXISTS (SELECT 1 FROM departments);

-- 6. Сотрудники
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(500) NOT NULL,
  phone VARCHAR(50) DEFAULT '',
  email_work VARCHAR(255) DEFAULT '',
  email_personal VARCHAR(255) DEFAULT '',
  telegram_id VARCHAR(100) DEFAULT '',
  position_id INT REFERENCES positions(id) ON DELETE SET NULL,
  department_id INT REFERENCES departments(id) ON DELETE SET NULL,
  user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
  hire_date DATE,
  fire_date DATE,
  salary NUMERIC(15,2),
  salary_currency VARCHAR(3) REFERENCES currency(id) ON DELETE SET NULL,
  payment_type VARCHAR(20) DEFAULT 'salary',
  employment_status VARCHAR(20) DEFAULT 'active',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Глава отдела — добавляем после создания employees
ALTER TABLE departments 
  ADD COLUMN IF NOT EXISTS head_employee_id INT REFERENCES employees(id) ON DELETE SET NULL;

SELECT 'MIGRATION COMPLETE' AS status;
