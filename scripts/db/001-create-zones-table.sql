-- Create zones table for world map regions
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('city', 'wilderness', 'dungeon', 'village', 'castle', 'forest', 'mountain', 'desert', 'ocean', 'underground')),
  danger_level INTEGER NOT NULL CHECK (danger_level BETWEEN 1 AND 10),
  coordinates JSONB NOT NULL,
  connected_zones UUID[],
  environment_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for zone type queries
CREATE INDEX IF NOT EXISTS idx_zones_type ON zones(type);

-- Create index for danger level queries
CREATE INDEX IF NOT EXISTS idx_zones_danger_level ON zones(danger_level);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_zones_updated_at
  BEFORE UPDATE ON zones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
