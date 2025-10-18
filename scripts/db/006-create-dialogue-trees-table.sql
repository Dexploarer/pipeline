-- Create dialogue trees table
CREATE TABLE IF NOT EXISTS dialogue_trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npc_id UUID REFERENCES npcs(id) ON DELETE CASCADE,
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
  tree_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for dialogue tree queries
CREATE INDEX IF NOT EXISTS idx_dialogue_trees_npc ON dialogue_trees(npc_id);
CREATE INDEX IF NOT EXISTS idx_dialogue_trees_quest ON dialogue_trees(quest_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_dialogue_trees_updated_at
  BEFORE UPDATE ON dialogue_trees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
