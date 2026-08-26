# Migration 59: Add enriched_at to contractors

Добавляет поле `enriched_at` в таблицу `contractors`.
Оно проставляется автоматически когда обогащение применено к контрагенту.
В фоновом (batch) режиме контрагенты с заполненным `enriched_at` пропускаются
(если включена опция «пропускать уже обогащённых»).
Ручное обогащение работает независимо от этого поля.

```sql
ALTER TABLE contractors ADD COLUMN IF NOT EXISTS enriched_at TIMESTAMPTZ;
```
