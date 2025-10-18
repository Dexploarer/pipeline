-- Create quests table for quest data
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  quest_type TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
  duration INTEGER,
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  layers JSONB NOT NULL DEFAULT '{}',
  objectives JSONB DEFAULT '[]',
  branches JSONB DEFAULT '[]',
  rewards JSONB DEFAULT '{}',
  prerequisites JSONB DEFAULT '{}',
  npc_ids UUID[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_quests_zone ON quests(zone_id);
CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status);
CREATE INDEX IF NOT EXISTS idx_quests_difficulty ON quests(difficulty);
CREATE INDEX IF NOT EXISTS idx_quests_type ON quests(quest_type);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_quests_updated_at
  BEFORE UPDATE ON quests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
