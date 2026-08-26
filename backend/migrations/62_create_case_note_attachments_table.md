-- ============================================
-- Migration 62: Create case_note_attachments table
-- ============================================
-- Table for storing attachments linked to case notes

CREATE TABLE IF NOT EXISTS case_note_attachments (
  id VARCHAR(50) PRIMARY KEY,
  note_id VARCHAR(50) NOT NULL,
  case_id VARCHAR(50) NOT NULL,
  name VARCHAR(500) NOT NULL,
  url TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'other',
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES legal_cases(id) ON DELETE CASCADE,
  FOREIGN KEY (note_id) REFERENCES case_notes(id) ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_case_note_attachments_note_id ON case_note_attachments(note_id);
CREATE INDEX IF NOT EXISTS idx_case_note_attachments_case_id ON case_note_attachments(case_id);
