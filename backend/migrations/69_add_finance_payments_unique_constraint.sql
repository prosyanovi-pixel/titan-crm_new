-- Migration: Add unique constraint to finance_payments to prevent duplicates
-- Purpose: Prevent duplicate payments with same amount, date, contractor, and kind

-- Add unique index for duplicate prevention
CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_payments_unique 
ON finance_payments (amount, payment_date, COALESCE(contractor_id, 0), kind);

-- Add comment to explain the constraint
COMMENT ON INDEX idx_finance_payments_unique IS 'Prevents duplicate payments with same amount, date, contractor, and kind';
