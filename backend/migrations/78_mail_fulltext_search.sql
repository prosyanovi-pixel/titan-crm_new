-- Полнотекстовый поиск для почты (PostgreSQL FTS)
-- Добавляем tsvector для быстрого поиска по письмам

-- Добавляем колонку для полнотекстового поиска
ALTER TABLE mail 
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Создаём функцию для обновления search_vector
CREATE OR REPLACE FUNCTION update_mail_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('russian', COALESCE(NEW.subject, '')), 'A') ||
    setweight(to_tsvector('russian', COALESCE(NEW.sender, '')), 'B') ||
    setweight(to_tsvector('russian', COALESCE(NEW.senderemail, '')), 'B') ||
    setweight(to_tsvector('russian', COALESCE(NEW.content, '')), 'C') ||
    setweight(to_tsvector('russian', COALESCE(NEW.html_content, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Создаём триггер для автоматического обновления search_vector
DROP TRIGGER IF EXISTS mail_search_vector_update ON mail;
CREATE TRIGGER mail_search_vector_update
  BEFORE INSERT OR UPDATE ON mail
  FOR EACH ROW
  EXECUTE FUNCTION update_mail_search_vector();

-- Заполняем существующие записи
UPDATE mail 
SET search_vector = 
  setweight(to_tsvector('russian', COALESCE(subject, '')), 'A') ||
  setweight(to_tsvector('russian', COALESCE(sender, '')), 'B') ||
  setweight(to_tsvector('russian', COALESCE(senderemail, '')), 'B') ||
  setweight(to_tsvector('russian', COALESCE(content, '')), 'C') ||
  setweight(to_tsvector('russian', COALESCE(html_content, '')), 'C');

-- Создаём индекс для ускорения поиска
CREATE INDEX IF NOT EXISTS idx_mail_search_vector ON mail USING GIN(search_vector);

-- Создаём функцию для поиска
CREATE OR REPLACE FUNCTION search_mails(
  search_query TEXT,
  p_user_id VARCHAR,
  p_account_id VARCHAR DEFAULT NULL,
  p_folder_id VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  mail_id VARCHAR,
  subject VARCHAR,
  sender VARCHAR,
  sender_email VARCHAR,
  content TEXT,
  date TIMESTAMP WITH TIME ZONE,
  read BOOLEAN,
  is_starred BOOLEAN,
  folder_id VARCHAR,
  has_attachments BOOLEAN,
  rank REAL,
  snippet TEXT
) AS $$
DECLARE
  query_tsquery TSQUERY;
BEGIN
  -- Преобразуем поисковый запрос в tsquery
  BEGIN
    -- Пробуем создать tsquery из пользовательского ввода
    query_tsquery := plainto_tsquery('russian', search_query);
  EXCEPTION WHEN OTHERS THEN
    -- Если ошибка, экранируем спецсимволы
    query_tsquery := plainto_tsquery('russian', regexp_replace(search_query, '[&|!():<>', ' ', 'g'));
  END;

  RETURN QUERY
  SELECT 
    m.id AS mail_id,
    m.subject,
    m.sender,
    m.senderemail AS sender_email,
    m.content,
    m.date,
    m.read,
    m.is_starred,
    m.folder_id,
    m.has_attachments,
    ts_rank(m.search_vector, query_tsquery) AS rank,
    -- Создаём snippet с подсветкой
    ts_headline(
      'russian',
      COALESCE(m.content, ''),
      query_tsquery,
      'StartSel=<b>, StopSel=</b>, MaxWords=50, MinWords=20'
    ) AS snippet
  FROM mail m
  WHERE 
    m.user_id = p_user_id
    AND m.search_vector @@ query_tsquery
    AND (p_account_id IS NULL OR m.account_id = p_account_id)
    AND (p_folder_id IS NULL OR m.folder_id = p_folder_id)
  ORDER BY rank DESC, m.date DESC
  LIMIT p_limit
  OFFSET p_offset;
END
$$ LANGUAGE plpgsql;

-- Индексы для ускорения фильтрации
CREATE INDEX IF NOT EXISTS idx_mail_user_account_folder ON mail(user_id, account_id, folder_id);
CREATE INDEX IF NOT EXISTS idx_mail_date_desc ON mail(date DESC);

COMMENT ON FUNCTION search_mails IS 'Полнотекстовый поиск по письмам с ранжированием';
COMMENT ON COLUMN mail.search_vector IS 'TSVector для полнотекстового поиска';
