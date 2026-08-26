-- Улучшения для IMAP синхронизации
-- Добавляем поля для отслеживания состояния синхронизации

-- Таблица для хранения состояния синхронизации по папкам
CREATE TABLE IF NOT EXISTS mail_sync_state (
  id VARCHAR(50) PRIMARY KEY,
  account_id VARCHAR(50) NOT NULL REFERENCES mail_accounts(id) ON DELETE CASCADE,
  folder_id VARCHAR(50) REFERENCES mail_folders(id) ON DELETE CASCADE,
  folder_name VARCHAR(255) NOT NULL,
  uid_validity BIGINT,
  last_uid BIGINT DEFAULT 0,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  sync_status VARCHAR(20) DEFAULT 'pending', -- pending, syncing, completed, error
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(account_id, folder_name)
);

-- Индексы для ускорения поиска
CREATE INDEX IF NOT EXISTS idx_mail_sync_state_account ON mail_sync_state(account_id);
CREATE INDEX IF NOT EXISTS idx_mail_sync_state_folder ON mail_sync_state(folder_id);
CREATE INDEX IF NOT EXISTS idx_mail_sync_state_status ON mail_sync_state(sync_status);

-- Добавляем поля в mail_accounts для управления синхронизацией
ALTER TABLE mail_accounts 
  ADD COLUMN IF NOT EXISTS last_sync_status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS last_sync_error TEXT,
  ADD COLUMN IF NOT EXISTS sync_errors_count INTEGER DEFAULT 0;

-- Добавляем поля в mail для IMAP метаданных
ALTER TABLE mail 
  ADD COLUMN IF NOT EXISTS message_id VARCHAR(500),
  ADD COLUMN IF NOT EXISTS imap_uid BIGINT,
  ADD COLUMN IF NOT EXISTS imap_flags TEXT[],
  ADD COLUMN IF NOT EXISTS in_reply_to VARCHAR(500),
  ADD COLUMN IF NOT EXISTS references_header TEXT;

-- Добавляем индекс для message_id для дедупликации
CREATE INDEX IF NOT EXISTS idx_mail_message_id ON mail(message_id);
CREATE INDEX IF NOT EXISTS idx_mail_account_folder ON mail(account_id, folder_id);

-- Таблица для очереди отправки писем
CREATE TABLE IF NOT EXISTS mail_send_queue (
  id VARCHAR(50) PRIMARY KEY,
  account_id VARCHAR(50) NOT NULL REFERENCES mail_accounts(id) ON DELETE CASCADE,
  user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mail_id VARCHAR(50) REFERENCES mail(id) ON DELETE CASCADE,
  to_addresses TEXT[] NOT NULL,
  cc_addresses TEXT[],
  bcc_addresses TEXT[],
  subject VARCHAR(500) NOT NULL,
  html_content TEXT,
  text_content TEXT,
  attachment_ids TEXT[],
  status VARCHAR(20) DEFAULT 'pending', -- pending, sending, sent, failed
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mail_send_queue_status ON mail_send_queue(status);
CREATE INDEX IF NOT EXISTS idx_mail_send_queue_scheduled ON mail_send_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_mail_send_queue_account ON mail_send_queue(account_id);

-- Таблица для логов синхронизации
CREATE TABLE IF NOT EXISTS mail_sync_logs (
  id VARCHAR(50) PRIMARY KEY,
  account_id VARCHAR(50) NOT NULL REFERENCES mail_accounts(id) ON DELETE CASCADE,
  sync_type VARCHAR(20) NOT NULL, -- full, incremental, folder_sync
  folder_name VARCHAR(255),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL, -- success, partial, error
  emails_synced INTEGER DEFAULT 0,
  emails_updated INTEGER DEFAULT 0,
  attachments_downloaded INTEGER DEFAULT 0,
  error_message TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mail_sync_logs_account ON mail_sync_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_mail_sync_logs_started ON mail_sync_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_mail_sync_logs_status ON mail_sync_logs(status);

COMMENT ON TABLE mail_sync_state IS 'Состояние синхронизации IMAP по папкам';
COMMENT ON TABLE mail_send_queue IS 'Очередь исходящих писем';
COMMENT ON TABLE mail_sync_logs IS 'Журнал синхронизации почты';
