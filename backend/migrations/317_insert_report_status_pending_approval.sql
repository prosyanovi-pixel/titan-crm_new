-- Migration 317: Insert pending_approval status into report_status

INSERT INTO report_status (id, name, displayorder, color)
VALUES ('pending_approval', 'Ожидает утверждения', 1, '#F59E0B')
ON CONFLICT (id) DO NOTHING;
