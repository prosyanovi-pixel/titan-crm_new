-- Migration: Remove duplicate payments before adding unique constraint
-- Purpose: Find and remove duplicate payments with same amount, date, contractor, and kind

-- Создаём временную таблицу с дубликатами
CREATE TEMP TABLE duplicate_payments AS
SELECT 
    amount,
    payment_date,
    COALESCE(contractor_id, 0) as contractor_key,
    kind,
    COUNT(*) as duplicate_count,
    array_agg(id ORDER BY created_at) as payment_ids
FROM finance_payments
GROUP BY amount, payment_date, COALESCE(contractor_id, 0), kind
HAVING COUNT(*) > 1;

-- Выводим информацию о дубликатах
SELECT 
    amount,
    payment_date,
    contractor_key,
    kind,
    duplicate_count,
    payment_ids
FROM duplicate_payments
ORDER BY payment_date DESC;

-- Удаляем дубликаты, оставляя только первую запись (по created_at)
DELETE FROM finance_payments
WHERE id IN (
    SELECT unnest(payment_ids[2:]) -- Оставляем первый ID, удаляем остальные
    FROM duplicate_payments
);

-- Проверяем результат
SELECT 
    'Duplicates removed' as status,
    COUNT(*) as remaining_duplicates
FROM (
    SELECT amount, payment_date, COALESCE(contractor_id, 0), kind
    FROM finance_payments
    GROUP BY amount, payment_date, COALESCE(contractor_id, 0), kind
    HAVING COUNT(*) > 1
) dup;

-- Очищаем временную таблицу
DROP TABLE duplicate_payments;
