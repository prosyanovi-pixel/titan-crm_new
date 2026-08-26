# Migration 55: Add processed_contractor_ids to enrichment_jobs

## Description
Добавляет поле для отслеживания контрагентов, которые уже были обработаны в текущей задаче обогащения. 
Это позволяет пропускать повторную проверку уже обработанных контрагентов при продолжении задачи.

## SQL

```sql
ALTER TABLE enrichment_jobs 
ADD COLUMN IF NOT EXISTS processed_contractor_ids JSONB DEFAULT '[]';
```
