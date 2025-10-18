-- Create relationships table for entity connections
CREATE TABLE IF NOT EXISTS relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_a_id UUID NOT NULL,
  entity_a_type TEXT NOT NULL CHECK (entity_a_type IN ('npc', 'quest', 'lore', 'zone')),
  entity_b_id UUID NOT NULL,
  entity_b_type TEXT NOT NULL CHECK (entity_b_type IN ('npc', 'quest', 'lore', 'zone')),
  relationship_type TEXT NOT NULL,
  strength INTEGER CHECK (strength BETWEEN -100 AND 100),
  description TEXT,
  zone_context UUID REFERENCES zones(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for relationship queries
CREATE INDEX IF NOT EXISTS idx_relationships_entity_a ON relationships(entity_a_id, entity_a_type);
CREATE INDEX IF NOT EXISTS idx_relationships_entity_b ON relationships(entity_b_id, entity_b_type);
CREATE INDEX IF NOT EXISTS idx_relationships_zone ON relationships(zone_context);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(relationship_type);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_relationships_updated_at
  BEFORE UPDATE ON relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
