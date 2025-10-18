-- Create content packs table for bundled content
CREATE TABLE IF NOT EXISTS content_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  zone_ids UUID[],
  npc_ids UUID[],
  quest_ids UUID[],
  lore_ids UUID[],
  version TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  bundle_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for content pack queries
CREATE INDEX IF NOT EXISTS idx_content_packs_name ON content_packs(name);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_content_packs_updated_at
  BEFORE UPDATE ON content_packs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
