ALTER TABLE chat_messages
ADD COLUMN is_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;

ALTER TABLE chats
ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;
