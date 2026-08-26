INSERT INTO modules (id, name, folder, icon, is_active)
VALUES ('ai', 'AI Insights', 'ai', 'Sparkles', true)
ON CONFLICT (id) DO NOTHING;
