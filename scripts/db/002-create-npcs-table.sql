-- Create NPCs table for character data
CREATE TABLE IF NOT EXISTS npcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  archetype TEXT NOT NULL,
  personality JSONB NOT NULL,
  dialogue_style TEXT,
  backstory TEXT,
  goals TEXT[],
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  spawn_locations JSONB DEFAULT '[]',
  ai_model_used TEXT,
  generation_metadata JSONB DEFAULT '{}',
  asset_urls JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_npcs_zone ON npcs(zone_id);
CREATE INDEX IF NOT EXISTS idx_npcs_archetype ON npcs(archetype);
CREATE INDEX IF NOT EXISTS idx_npcs_name ON npcs(name);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_npcs_updated_at
  BEFORE UPDATE ON npcs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
