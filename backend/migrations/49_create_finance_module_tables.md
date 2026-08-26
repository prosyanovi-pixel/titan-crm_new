# Migration 49: Create finance module tables

## Description
Создает таблицы модуля Финансы: счета, платежи, документы счета и справочник статусов счета.

## SQL
```sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'finance_invoice_status'
    ) THEN
        CREATE TABLE finance_invoice_status (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            color TEXT,
            displayorder INTEGER NOT NULL DEFAULT 0
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'finance_invoices'
    ) THEN
        CREATE TABLE finance_invoices (
            id TEXT PRIMARY KEY,
            identifier TEXT UNIQUE NOT NULL,
            contractor_id INTEGER,
            project_id INTEGER,
            lawyer_user_id TEXT,
            source_task_id TEXT,
            title TEXT NOT NULL,
            description TEXT,
            currency TEXT NOT NULL DEFAULT 'RUB',
            amount_total NUMERIC(14,2) NOT NULL DEFAULT 0,
            amount_paid NUMERIC(14,2) NOT NULL DEFAULT 0,
            amount_due NUMERIC(14,2) NOT NULL DEFAULT 0,
            issue_date DATE NOT NULL,
            due_date DATE NOT NULL,
            status TEXT NOT NULL DEFAULT 'draft',
            calendar_event_id TEXT,
            created_by TEXT,
            updated_by TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'finance_payments'
    ) THEN
        CREATE TABLE finance_payments (
            id TEXT PRIMARY KEY,
            kind TEXT NOT NULL,
            invoice_id TEXT,
            project_id INTEGER,
            contractor_id INTEGER,
            amount NUMERIC(14,2) NOT NULL,
            currency TEXT NOT NULL DEFAULT 'RUB',
            payment_date DATE NOT NULL,
            method TEXT,
            comment TEXT,
            created_by TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT finance_payments_relation_chk CHECK (
                invoice_id IS NOT NULL OR project_id IS NOT NULL OR contractor_id IS NOT NULL
            )
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'finance_invoice_documents'
    ) THEN
        CREATE TABLE finance_invoice_documents (
            id TEXT PRIMARY KEY,
            invoice_id TEXT NOT NULL,
            document_type TEXT NOT NULL,
            document_id TEXT,
            template_payload JSONB,
            status TEXT NOT NULL DEFAULT 'generated',
            created_by TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_finance_invoices_status ON finance_invoices(status);
CREATE INDEX IF NOT EXISTS idx_finance_invoices_due_date ON finance_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_finance_invoices_project_id ON finance_invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_finance_invoices_contractor_id ON finance_invoices(contractor_id);
CREATE INDEX IF NOT EXISTS idx_finance_payments_invoice_id ON finance_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_finance_payments_project_id ON finance_payments(project_id);

INSERT INTO finance_invoice_status (id, name, color, displayorder)
VALUES
    ('draft', 'Черновик', '#94A3B8', 10),
    ('sent', 'Отправлен', '#3B82F6', 20),
    ('partial_paid', 'Оплачен частично', '#F59E0B', 30),
    ('paid', 'Оплачен', '#22C55E', 40),
    ('overdue', 'Просрочен', '#EF4444', 50)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    color = EXCLUDED.color,
    displayorder = EXCLUDED.displayorder;
```
