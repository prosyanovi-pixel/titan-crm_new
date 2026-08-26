# Migration 50: Seed finance quick actions

## Description
Гарантированно добавляет быстрые действия для модуля `finance`.

## SQL Statement
```sql
INSERT INTO quick_actions (id, name, icon, action, module, displayorder, is_active) VALUES
('finance_create_invoice', 'Создать счёт', 'Plus', 'create_invoice', 'finance', 1, TRUE),
('finance_record_payment', 'Записать платёж', 'DollarSign', 'record_payment', 'finance', 2, TRUE),
('finance_generate_document', 'Сформировать документ', 'FileText', 'generate_document', 'finance', 3, TRUE)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    action = EXCLUDED.action,
    module = EXCLUDED.module,
    displayorder = EXCLUDED.displayorder,
    is_active = TRUE;
```
