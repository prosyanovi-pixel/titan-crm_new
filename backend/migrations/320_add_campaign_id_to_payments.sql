-- Migration 320: Add campaign_id to finance_payments for marketing integration
-- Цель: Связать платежи с маркетинговыми кампаниями

ALTER TABLE finance_payments
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_finance_payments_campaign_id ON finance_payments(campaign_id);

-- Обновляем actual_cost кампаний на основе существующих платежей (если есть связь через проекты)
-- Пока оставляем ручные значения, в будущем можно мигрировать
