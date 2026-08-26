CREATE TABLE chats (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(50) NOT NULL, 
  external_chat_id VARCHAR(255),
  name VARCHAR(255),
  avatar_url VARCHAR(255),
  unread_count INTEGER DEFAULT 0,
  contractor_id INTEGER REFERENCES contractors(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(platform, external_chat_id)
);

CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
  external_message_id VARCHAR(255),
  sender_type VARCHAR(50) NOT NULL, 
  sender_id INTEGER,
  text TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
