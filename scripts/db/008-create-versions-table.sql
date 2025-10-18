-- Create content versions table for version control
CREATE TABLE IF NOT EXISTS content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('npc', 'quest', 'lore', 'zone', 'relationship', 'dialogue_tree')),
  version INTEGER NOT NULL CHECK (version > 0),
  data JSONB NOT NULL,
  commit_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for version queries
CREATE INDEX IF NOT EXISTS idx_versions_entity ON content_versions(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_versions_created_at ON content_versions(created_at DESC);

-- Create unique constraint to prevent duplicate versions
CREATE UNIQUE INDEX IF NOT EXISTS idx_versions_unique ON content_versions(entity_id, entity_type, version);
