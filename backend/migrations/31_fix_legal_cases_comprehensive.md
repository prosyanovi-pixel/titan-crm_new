-- ============================================
-- Fix legal cases tables - comprehensive migration
-- ============================================

-- ============================================
-- Part 1: Rename columns to snake_case
-- ============================================

-- Rename columns in case_financial_details table to snake_case (if needed)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='caseid'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='case_id'
    ) THEN
        ALTER TABLE case_financial_details RENAME COLUMN caseid TO case_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='claimamount'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='claim_amount'
    ) THEN
        ALTER TABLE case_financial_details RENAME COLUMN claimamount TO claim_amount;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='claimcurrency'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='claim_currency'
    ) THEN
        ALTER TABLE case_financial_details RENAME COLUMN claimcurrency TO claim_currency;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='stateduty'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='state_duty'
    ) THEN
        ALTER TABLE case_financial_details RENAME COLUMN stateduty TO state_duty;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='expertisecost'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='expertise_cost'
    ) THEN
        ALTER TABLE case_financial_details RENAME COLUMN expertisecost TO expertise_cost;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='otherclaimcosts'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='other_claim_costs'
    ) THEN
        ALTER TABLE case_financial_details RENAME COLUMN otherclaimcosts TO other_claim_costs;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='recoveredamount'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='recovered_amount'
    ) THEN
        ALTER TABLE case_financial_details RENAME COLUMN recoveredamount TO recovered_amount;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='recoveredcurrency'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='recovered_currency'
    ) THEN
        ALTER TABLE case_financial_details RENAME COLUMN recoveredcurrency TO recovered_currency;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='enforcementfee'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='enforcement_fee'
    ) THEN
        ALTER TABLE case_financial_details RENAME COLUMN enforcementfee TO enforcement_fee;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='executioncosts'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='execution_costs'
    ) THEN
        ALTER TABLE case_financial_details RENAME COLUMN executioncosts TO execution_costs;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='transportexpenses'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='transport_expenses'
    ) THEN
        ALTER TABLE case_financial_details RENAME COLUMN transportexpenses TO transport_expenses;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='translationexpenses'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='translation_expenses'
    ) THEN
        ALTER TABLE case_financial_details RENAME COLUMN translationexpenses TO translation_expenses;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='otherexpenses'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_financial_details' AND column_name='other_expenses'
    ) THEN
        ALTER TABLE case_financial_details RENAME COLUMN otherexpenses TO other_expenses;
    END IF;
END $$;

-- Rename columns in case_events table to snake_case (if needed)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_events' AND column_name='caseid'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_events' AND column_name='case_id'
    ) THEN
        ALTER TABLE case_events RENAME COLUMN caseid TO case_id;
    END IF;
END $$;

-- Rename columns in case_documents table to snake_case (if needed)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_documents' AND column_name='caseid'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_documents' AND column_name='case_id'
    ) THEN
        ALTER TABLE case_documents RENAME COLUMN caseid TO case_id;
    END IF;
END $$;

-- Rename columns in case_document_comments table to snake_case (if needed)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_document_comments' AND column_name='documentid'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_document_comments' AND column_name='document_id'
    ) THEN
        ALTER TABLE case_document_comments RENAME COLUMN documentid TO document_id;
    END IF;
END $$;

-- Rename columns in case_notes table to snake_case (if needed)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_notes' AND column_name='caseid'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='case_notes' AND column_name='case_id'
    ) THEN
        ALTER TABLE case_notes RENAME COLUMN caseid TO case_id;
    END IF;
END $$;

-- ============================================
-- Part 2: Add missing columns to legal_cases table
-- ============================================

-- Add lawyer_name column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='legal_cases' AND column_name='lawyer_name'
    ) THEN
        ALTER TABLE legal_cases ADD COLUMN lawyer_name VARCHAR(255);
    END IF;
END $$;

-- Add case_number column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='legal_cases' AND column_name='case_number'
    ) THEN
        ALTER TABLE legal_cases ADD COLUMN case_number VARCHAR(100);
    END IF;
END $$;

-- Add lawyer_id column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='legal_cases' AND column_name='lawyer_id'
    ) THEN
        ALTER TABLE legal_cases ADD COLUMN lawyer_id VARCHAR(50);
    END IF;
END $$;

-- Add defendant column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='legal_cases' AND column_name='defendant'
    ) THEN
        ALTER TABLE legal_cases ADD COLUMN defendant VARCHAR(255);
    END IF;
END $$;

-- Add court_name column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='legal_cases' AND column_name='court_name'
    ) THEN
        ALTER TABLE legal_cases ADD COLUMN court_name VARCHAR(255);
    END IF;
END $$;

-- Add judge column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='legal_cases' AND column_name='judge'
    ) THEN
        ALTER TABLE legal_cases ADD COLUMN judge VARCHAR(255);
    END IF;
END $$;

-- Add creation_date column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='legal_cases' AND column_name='creation_date'
    ) THEN
        ALTER TABLE legal_cases ADD COLUMN creation_date VARCHAR(50);
    END IF;
END $$;

-- Add start_date column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='legal_cases' AND column_name='start_date'
    ) THEN
        ALTER TABLE legal_cases ADD COLUMN start_date VARCHAR(50);
    END IF;
END $$;

-- ============================================
-- Part 3: Fix case_financial_details id column to be auto-increment
-- ============================================

-- Create the sequence if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS case_financial_details_id_seq;

-- Set ownership of the sequence
ALTER SEQUENCE case_financial_details_id_seq OWNED BY case_financial_details.id;

-- Set the default value for id
ALTER TABLE case_financial_details ALTER COLUMN id SET DEFAULT nextval('case_financial_details_id_seq');

-- If the column is not already a primary key, add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'case_financial_details_pkey'
    ) THEN
        ALTER TABLE case_financial_details ADD PRIMARY KEY (id);
    END IF;
END $$;
