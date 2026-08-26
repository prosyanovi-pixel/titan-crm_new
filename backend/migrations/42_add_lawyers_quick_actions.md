# Migration 42: Add Additional Quick Actions for Lawyers Module

## Description
Add more comprehensive quick actions for the lawyers module to improve usability.

## SQL Statement
```sql
-- Additional quick actions for Lawyers module
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('qa_law_2', 'Создать дело', 'Briefcase', 'create_case', 'lawyers', 2, true),
('qa_law_3', 'Назначить встречу', 'Calendar', 'schedule_meeting', 'lawyers', 3, true),
('qa_law_4', 'Добавить документ', 'FileText', 'add_document', 'lawyers', 4, true),
('qa_law_5', 'Отправить письмо', 'Mail', 'send_email', 'lawyers', 5, true),
('qa_law_6', 'Добавить заметку', 'StickyNote', 'add_note', 'lawyers', 6, true),
('qa_law_7', 'Позвонить', 'Phone', 'make_call', 'lawyers', 7, true),
('qa_law_8', 'Экспорт отчёта', 'Download', 'export_report', 'lawyers', 8, true)
ON CONFLICT (id) DO NOTHING;
```

## Notes
- These actions provide a more complete set of quick actions for lawyers
- Using ON CONFLICT to avoid issues if migration is run multiple times
- Actions include common lawyer tasks like creating cases, scheduling meetings, etc.