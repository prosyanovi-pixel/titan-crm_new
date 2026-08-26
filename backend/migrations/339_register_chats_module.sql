INSERT INTO modules (id, name, folder, icon)
VALUES ('chats', 'Чаты (Unified Inbox)', 'chats', 'message-square')
ON CONFLICT (id) DO NOTHING;
