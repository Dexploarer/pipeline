-- Create lore entries table
CREATE TABLE IF NOT EXISTS lore_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  related_npc_ids UUID[],
  related_quest_ids UUID[],
  timeline_position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_lore_zone ON lore_entries(zone_id);
CREATE INDEX IF NOT EXISTS idx_lore_category ON lore_entries(category);
CREATE INDEX IF NOT EXISTS idx_lore_tags ON lore_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_lore_timeline ON lore_entries(timeline_position);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_lore_entries_updated_at
  BEFORE UPDATE ON lore_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
