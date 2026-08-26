-- Migration 76: Comprehensive Mail Module Schema
-- Extends mail table and creates supporting tables for full mail functionality

-- Add missing columns to mail table if they don't exist
ALTER TABLE mail
ADD COLUMN IF NOT EXISTS folder_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS account_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS html_content TEXT,
ADD COLUMN IF NOT EXISTS has_attachments BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS user_id VARCHAR(50);

-- Create mail_accounts table for storing user email accounts
CREATE TABLE IF NOT EXISTS mail_accounts (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    account_type VARCHAR(50) NOT NULL, -- 'imap', 'pop3', 'gmail', 'office365'
    imap_host VARCHAR(255),
    imap_port INTEGER DEFAULT 993,
    smtp_host VARCHAR(255),
    smtp_port INTEGER DEFAULT 587,
    login VARCHAR(255),
    password_encrypted VARCHAR(500), -- encrypted password or OAuth token
    use_tls BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_sync TIMESTAMP,
    sync_interval_minutes INTEGER DEFAULT 5,
    sync_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, email),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create mail_folders table for custom folders
CREATE TABLE IF NOT EXISTS mail_folders (
    id VARCHAR(50) PRIMARY KEY,
    account_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    folder_name VARCHAR(255) NOT NULL,
    folder_type VARCHAR(50), -- 'system' (inbox, sent, drafts, trash, archive) or 'custom'
    parent_folder_id VARCHAR(50),
    imap_folder_path VARCHAR(500),
    unseen_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES mail_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_folder_id) REFERENCES mail_folders(id) ON DELETE CASCADE,
    UNIQUE(account_id, folder_name)
);

-- Create mail_filters table for filtering rules
CREATE TABLE IF NOT EXISTS mail_filters (
    id VARCHAR(50) PRIMARY KEY,
    account_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    filter_name VARCHAR(255) NOT NULL,
    description TEXT,
    match_type VARCHAR(50), -- 'all' or 'any'
    target_folder_id VARCHAR(50),
    apply_star BOOLEAN DEFAULT FALSE,
    apply_read BOOLEAN DEFAULT FALSE,
    apply_mark_read BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES mail_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (target_folder_id) REFERENCES mail_folders(id) ON DELETE SET NULL
);

-- Create mail_filter_conditions table for filter conditions
CREATE TABLE IF NOT EXISTS mail_filter_conditions (
    id VARCHAR(50) PRIMARY KEY,
    filter_id VARCHAR(50) NOT NULL,
    condition_type VARCHAR(50) NOT NULL, -- 'from', 'to', 'subject', 'body', 'has_attachment', 'size', 'date'
    operator VARCHAR(50) NOT NULL, -- 'contains', 'equals', 'starts_with', 'ends_with', 'greater_than', 'less_than'
    condition_value VARCHAR(500),
    is_regex BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (filter_id) REFERENCES mail_filters(id) ON DELETE CASCADE
);

-- Create mail_attachments table for file tracking
CREATE TABLE IF NOT EXISTS mail_attachments (
    id VARCHAR(50) PRIMARY KEY,
    mail_id VARCHAR(50),
    filename VARCHAR(500) NOT NULL,
    content_type VARCHAR(100),
    file_size BIGINT,
    stored_path VARCHAR(500),
    attachment_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mail_id) REFERENCES mail(id) ON DELETE CASCADE
);

-- Create mail_labels table for flexible tagging
CREATE TABLE IF NOT EXISTS mail_labels (
    id VARCHAR(50) PRIMARY KEY,
    account_id VARCHAR(50),
    user_id VARCHAR(50) NOT NULL,
    label_name VARCHAR(100) NOT NULL,
    label_color VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, label_name),
    FOREIGN KEY (account_id) REFERENCES mail_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create mail_labels_mapping table for many-to-many relationship
CREATE TABLE IF NOT EXISTS mail_labels_mapping (
    id VARCHAR(50) PRIMARY KEY,
    mail_id VARCHAR(50) NOT NULL,
    label_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mail_id, label_id),
    FOREIGN KEY (mail_id) REFERENCES mail(id) ON DELETE CASCADE,
    FOREIGN KEY (label_id) REFERENCES mail_labels(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mail_user_id ON mail(user_id);
CREATE INDEX IF NOT EXISTS idx_mail_account_id ON mail(account_id);
CREATE INDEX IF NOT EXISTS idx_mail_folder_id ON mail(folder_id);
CREATE INDEX IF NOT EXISTS idx_mail_created_at ON mail(created_at);
CREATE INDEX IF NOT EXISTS idx_mail_accounts_user_id ON mail_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_mail_accounts_email ON mail_accounts(email);
CREATE INDEX IF NOT EXISTS idx_mail_folders_account_id ON mail_folders(account_id);
CREATE INDEX IF NOT EXISTS idx_mail_filters_account_id ON mail_filters(account_id);
CREATE INDEX IF NOT EXISTS idx_mail_attachments_mail_id ON mail_attachments(mail_id);
CREATE INDEX IF NOT EXISTS idx_mail_labels_user_id ON mail_labels(user_id);

-- Add system and default folders for existing accounts (if any)
-- This will be handled by the migration script
