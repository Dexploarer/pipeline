-- Create audit logs table for tracking all changes
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  changes JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- Add user tracking to existing tables
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS updated_by TEXT;

ALTER TABLE quests ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS updated_by TEXT;

ALTER TABLE zones ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE zones ADD COLUMN IF NOT EXISTS updated_by TEXT;

ALTER TABLE lore_entries ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE lore_entries ADD COLUMN IF NOT EXISTS updated_by TEXT;

ALTER TABLE content_packs ADD COLUMN IF NOT EXISTS created_by TEXT;
