-- 100_mdm_contractors_refactoring.sql

-- 1. Create contractor_documents table
CREATE TABLE IF NOT EXISTS public.contractor_documents (
    id SERIAL PRIMARY KEY,
    contractor_id INTEGER NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- Паспорт РФ, Загранпаспорт, ВНЖ, и т.д.
    series VARCHAR(50),
    number VARCHAR(50) NOT NULL,
    issue_date DATE,
    expiry_date DATE,
    issued_by TEXT,
    department_code VARCHAR(50),
    is_primary BOOLEAN DEFAULT false,
    scan_copy_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Alter contractors table
ALTER TABLE public.contractors
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS middle_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS snils VARCHAR(50),
ADD COLUMN IF NOT EXISTS citizenship VARCHAR(100),
ADD COLUMN IF NOT EXISTS country_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS kio VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_currency_resident BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS person_id INTEGER REFERENCES public.contractors(id) ON DELETE SET NULL;

-- 3. Alter contractor_contacts table
ALTER TABLE public.contractor_contacts
ADD COLUMN IF NOT EXISTS person_id INTEGER REFERENCES public.contractors(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS authority_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS authority_document TEXT,
ADD COLUMN IF NOT EXISTS work_phone VARCHAR(100),
ADD COLUMN IF NOT EXISTS work_email VARCHAR(255);

-- 4. Alter contractor_bank_accounts table
ALTER TABLE public.contractor_bank_accounts
ADD COLUMN IF NOT EXISTS account_purpose VARCHAR(100),
ADD COLUMN IF NOT EXISTS iban VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_address TEXT;
