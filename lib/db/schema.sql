-- NPC Content Pipeline Database Schema
-- PostgreSQL 14+
-- Supports full content generation, versioning, and multi-tenancy

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For multi-column indexes

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE user_role AS ENUM ('admin', 'creator', 'viewer');
CREATE TYPE npc_archetype AS ENUM ('merchant', 'warrior', 'scholar', 'rogue', 'mystic', 'noble', 'commoner');
CREATE TYPE zone_type AS ENUM ('city', 'wilderness', 'dungeon', 'village', 'landmark', 'region');
CREATE TYPE quest_status AS ENUM ('active', 'completed', 'failed', 'abandoned');
CREATE TYPE relationship_type AS ENUM ('ally', 'enemy', 'neutral', 'trading_partner', 'rival', 'family');
CREATE TYPE lore_category AS ENUM ('history', 'culture', 'geography', 'magic', 'religion', 'politics', 'economy', 'legend', 'bestiary');
CREATE TYPE content_pack_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE asset_type AS ENUM ('image', 'audio', 'text', 'model', 'archive');

-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  role user_role NOT NULL DEFAULT 'creator',
  avatar_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ============================================================================
-- WORLD STRUCTURE
-- ============================================================================

CREATE TABLE zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type zone_type NOT NULL,
  danger_level INTEGER NOT NULL DEFAULT 1 CHECK (danger_level >= 1 AND danger_level <= 10),
  coordinates JSONB, -- { x, y, z }
  parent_zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  factions JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zones_type ON zones(type);
CREATE INDEX idx_zones_danger_level ON zones(danger_level);
CREATE INDEX idx_zones_parent ON zones(parent_zone_id);
CREATE INDEX idx_zones_created_by ON zones(created_by);
CREATE INDEX idx_zones_metadata ON zones USING gin(metadata);

CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  zone_ids UUID[] NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_regions_zone_ids ON regions USING gin(zone_ids);
CREATE INDEX idx_regions_created_by ON regions(created_by);

-- ============================================================================
-- NPCs
-- ============================================================================

CREATE TABLE npcs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  archetype npc_archetype NOT NULL,
  personality JSONB NOT NULL DEFAULT '{}',
  dialogue_style TEXT,
  backstory TEXT,
  goals TEXT[],
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  spawn_point JSONB, -- { x, y, z, rotation }
  behavior JSONB DEFAULT '{}',
  elizaos_config JSONB,
  metadata JSONB DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_npcs_archetype ON npcs(archetype);
CREATE INDEX idx_npcs_zone_id ON npcs(zone_id);
CREATE INDEX idx_npcs_created_by ON npcs(created_by);
CREATE INDEX idx_npcs_name_trgm ON npcs USING gin(name gin_trgm_ops);
CREATE INDEX idx_npcs_personality ON npcs USING gin(personality);
CREATE INDEX idx_npcs_metadata ON npcs USING gin(metadata);

-- ============================================================================
-- QUESTS
-- ============================================================================

CREATE TABLE quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  objectives JSONB NOT NULL DEFAULT '[]',
  rewards JSONB DEFAULT '{}',
  requirements JSONB DEFAULT '{}',
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  quest_giver_npc_id UUID REFERENCES npcs(id) ON DELETE SET NULL,

  -- 6-layer quest system
  gameflow_layer JSONB,
  lore_layer JSONB,
  history_layer JSONB,
  relationships_layer JSONB,
  economy_layer JSONB,
  world_events_layer JSONB,

  status quest_status NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quests_zone_id ON quests(zone_id);
CREATE INDEX idx_quests_quest_giver ON quests(quest_giver_npc_id);
CREATE INDEX idx_quests_status ON quests(status);
CREATE INDEX idx_quests_created_by ON quests(created_by);
CREATE INDEX idx_quests_title_trgm ON quests USING gin(title gin_trgm_ops);

-- ============================================================================
-- DIALOGUE TREES
-- ============================================================================

CREATE TABLE dialogue_trees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  npc_id UUID REFERENCES npcs(id) ON DELETE CASCADE,
  nodes JSONB NOT NULL DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dialogue_trees_npc_id ON dialogue_trees(npc_id);
CREATE INDEX idx_dialogue_trees_created_by ON dialogue_trees(created_by);

-- ============================================================================
-- LORE
-- ============================================================================

CREATE TABLE lore (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category lore_category NOT NULL,
  tags TEXT[] DEFAULT '{}',
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  related_npc_ids UUID[] DEFAULT '{}',
  related_quest_ids UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lore_category ON lore(category);
CREATE INDEX idx_lore_zone_id ON lore(zone_id);
CREATE INDEX idx_lore_tags ON lore USING gin(tags);
CREATE INDEX idx_lore_created_by ON lore(created_by);
CREATE INDEX idx_lore_title_trgm ON lore USING gin(title gin_trgm_ops);
CREATE INDEX idx_lore_content_trgm ON lore USING gin(content gin_trgm_ops);

-- ============================================================================
-- RELATIONSHIPS
-- ============================================================================

CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_npc_id UUID REFERENCES npcs(id) ON DELETE CASCADE,
  target_npc_id UUID REFERENCES npcs(id) ON DELETE CASCADE,
  relationship_type relationship_type NOT NULL,
  strength INTEGER NOT NULL DEFAULT 0 CHECK (strength >= -100 AND strength <= 100),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_relationship UNIQUE (source_npc_id, target_npc_id)
);

CREATE INDEX idx_relationships_source ON relationships(source_npc_id);
CREATE INDEX idx_relationships_target ON relationships(target_npc_id);
CREATE INDEX idx_relationships_type ON relationships(relationship_type);
CREATE INDEX idx_relationships_strength ON relationships(strength);

-- ============================================================================
-- CONTENT PACKS
-- ============================================================================

CREATE TABLE content_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  description TEXT,
  author VARCHAR(255),
  category VARCHAR(100),
  tags TEXT[] DEFAULT '{}',

  -- Zone associations
  zone_ids UUID[] DEFAULT '{}',

  -- ElizaOS components
  actions JSONB DEFAULT '[]',
  providers JSONB DEFAULT '[]',
  evaluators JSONB DEFAULT '[]',
  systems JSONB DEFAULT '[]',
  state_managers JSONB DEFAULT '[]',

  -- Metadata
  dependencies TEXT[] DEFAULT '{}',
  compatibility JSONB DEFAULT '{}',
  status content_pack_status NOT NULL DEFAULT 'draft',
  download_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',

  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX idx_content_packs_status ON content_packs(status);
CREATE INDEX idx_content_packs_category ON content_packs(category);
CREATE INDEX idx_content_packs_tags ON content_packs USING gin(tags);
CREATE INDEX idx_content_packs_created_by ON content_packs(created_by);
CREATE INDEX idx_content_packs_zone_ids ON content_packs USING gin(zone_ids);

-- ============================================================================
-- ASSETS
-- ============================================================================

CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  type asset_type NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,
  url TEXT NOT NULL,
  blob_id TEXT,

  -- Entity associations
  npc_id UUID REFERENCES npcs(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,
  quest_id UUID REFERENCES quests(id) ON DELETE SET NULL,
  content_pack_id UUID REFERENCES content_packs(id) ON DELETE SET NULL,

  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_npc_id ON assets(npc_id);
CREATE INDEX idx_assets_zone_id ON assets(zone_id);
CREATE INDEX idx_assets_quest_id ON assets(quest_id);
CREATE INDEX idx_assets_content_pack_id ON assets(content_pack_id);
CREATE INDEX idx_assets_created_by ON assets(created_by);

-- ============================================================================
-- VERSION HISTORY
-- ============================================================================

CREATE TABLE entity_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL, -- 'npc', 'quest', 'dialogue_tree', 'lore'
  entity_id UUID NOT NULL,
  version INTEGER NOT NULL,
  data JSONB NOT NULL,
  change_summary TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_entity_versions_entity ON entity_versions(entity_type, entity_id);
CREATE INDEX idx_entity_versions_version ON entity_versions(entity_type, entity_id, version);
CREATE INDEX idx_entity_versions_created_by ON entity_versions(created_by);

-- ============================================================================
-- AI GENERATION HISTORY
-- ============================================================================

CREATE TABLE generation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  generation_type VARCHAR(50) NOT NULL, -- 'npc', 'quest', 'dialogue', 'lore'
  prompt TEXT NOT NULL,
  model VARCHAR(100) NOT NULL,
  context JSONB DEFAULT '{}',
  result JSONB,
  tokens_used INTEGER,
  generation_time_ms INTEGER,
  cache_hit BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_generation_history_user_id ON generation_history(user_id);
CREATE INDEX idx_generation_history_type ON generation_history(generation_type);
CREATE INDEX idx_generation_history_model ON generation_history(model);
CREATE INDEX idx_generation_history_created_at ON generation_history(created_at);

-- ============================================================================
-- PLAYER STATE (for simulation/testing)
-- ============================================================================

CREATE TABLE player_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL,
  state_type VARCHAR(100) NOT NULL,
  state_data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_player_state UNIQUE (player_id, state_type)
);

CREATE INDEX idx_player_states_player ON player_states(player_id);
CREATE INDEX idx_player_states_type ON player_states(state_type);

-- ============================================================================
-- SIMULATION SESSIONS
-- ============================================================================

CREATE TABLE simulation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255),
  npc_id UUID REFERENCES npcs(id) ON DELETE CASCADE,
  player_id UUID,
  events JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX idx_simulation_sessions_npc_id ON simulation_sessions(npc_id);
CREATE INDEX idx_simulation_sessions_player_id ON simulation_sessions(player_id);
CREATE INDEX idx_simulation_sessions_created_by ON simulation_sessions(created_by);

-- ============================================================================
-- AUDIT LOG
-- ============================================================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zones_updated_at BEFORE UPDATE ON zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON regions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_npcs_updated_at BEFORE UPDATE ON npcs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quests_updated_at BEFORE UPDATE ON quests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dialogue_trees_updated_at BEFORE UPDATE ON dialogue_trees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lore_updated_at BEFORE UPDATE ON lore
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_packs_updated_at BEFORE UPDATE ON content_packs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_states_updated_at BEFORE UPDATE ON player_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERSIONING TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION create_entity_version()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO entity_versions (entity_type, entity_id, version, data, created_by)
    VALUES (
      TG_TABLE_NAME,
      OLD.id,
      OLD.version,
      row_to_json(OLD),
      COALESCE(NEW.updated_by, OLD.created_by) -- Use updated_by if available, fallback to created_by
    );
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER version_npcs BEFORE UPDATE ON npcs
  FOR EACH ROW EXECUTE FUNCTION create_entity_version();

CREATE TRIGGER version_quests BEFORE UPDATE ON quests
  FOR EACH ROW EXECUTE FUNCTION create_entity_version();

CREATE TRIGGER version_dialogue_trees BEFORE UPDATE ON dialogue_trees
  FOR EACH ROW EXECUTE FUNCTION create_entity_version();

CREATE TRIGGER version_lore BEFORE UPDATE ON lore
  FOR EACH ROW EXECUTE FUNCTION create_entity_version();

-- ============================================================================
-- FULL-TEXT SEARCH
-- ============================================================================

-- Combined search view for content
CREATE MATERIALIZED VIEW content_search AS
SELECT
  'npc' AS entity_type,
  id,
  name AS title,
  backstory AS content,
  zone_id,
  created_at,
  updated_at
FROM npcs
UNION ALL
SELECT
  'quest' AS entity_type,
  id,
  title,
  description AS content,
  zone_id,
  created_at,
  updated_at
FROM quests
UNION ALL
SELECT
  'lore' AS entity_type,
  id,
  title,
  content,
  zone_id,
  created_at,
  updated_at
FROM lore;

CREATE INDEX idx_content_search_type ON content_search(entity_type);
CREATE INDEX idx_content_search_zone ON content_search(zone_id);
CREATE INDEX idx_content_search_title_trgm ON content_search USING gin(title gin_trgm_ops);
CREATE INDEX idx_content_search_content_trgm ON content_search USING gin(content gin_trgm_ops);

-- Create unique index for CONCURRENTLY refresh support
CREATE UNIQUE INDEX content_search_pkey ON content_search(entity_type, id);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_content_search()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY content_search;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Create system user
INSERT INTO users (id, email, username, display_name, role, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'system@npcpipeline.com',
  'system',
  'System',
  'admin',
  true
) ON CONFLICT (id) DO NOTHING;

-- Create default zone
INSERT INTO zones (id, name, description, type, danger_level, created_by)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Default Zone',
  'The default zone for unassigned content',
  'region',
  1,
  '00000000-0000-0000-0000-000000000000'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get NPCs in zone with relationships
CREATE OR REPLACE FUNCTION get_zone_npcs_with_relationships(zone_uuid UUID)
RETURNS TABLE (
  npc JSONB,
  relationships JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    row_to_json(n.*)::jsonb AS npc,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', r.id,
          'target_npc_id', r.target_npc_id,
          'relationship_type', r.relationship_type,
          'strength', r.strength,
          'description', r.description
        )
      ) FILTER (WHERE r.id IS NOT NULL),
      '[]'::jsonb
    ) AS relationships
  FROM npcs n
  LEFT JOIN relationships r ON n.id = r.source_npc_id
  WHERE n.zone_id = zone_uuid
  GROUP BY n.id;
END;
$$ LANGUAGE plpgsql;

-- Search content by text
CREATE OR REPLACE FUNCTION search_content(search_text TEXT, limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  title TEXT,
  content TEXT,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cs.entity_type,
    cs.id,
    cs.title,
    cs.content,
    GREATEST(
      similarity(cs.title, search_text),
      similarity(cs.content, search_text)
    ) AS sim
  FROM content_search cs
  WHERE
    cs.title % search_text OR
    cs.content % search_text
  ORDER BY sim DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts with role-based access';
COMMENT ON TABLE zones IS 'World zones and regions for spatial organization';
COMMENT ON TABLE npcs IS 'Non-player character definitions with AI-generated personality';
COMMENT ON TABLE quests IS 'Quest definitions with 6-layer system';
COMMENT ON TABLE dialogue_trees IS 'Branching dialogue trees for NPCs';
COMMENT ON TABLE lore IS 'World lore entries with categorization';
COMMENT ON TABLE relationships IS 'NPC-to-NPC relationships with strength metrics';
COMMENT ON TABLE content_packs IS 'Bundled content for ElizaOS integration';
COMMENT ON TABLE assets IS 'Binary assets (images, audio, models)';
COMMENT ON TABLE entity_versions IS 'Version history for all versionable entities';
COMMENT ON TABLE generation_history IS 'AI generation audit trail';
COMMENT ON TABLE audit_log IS 'Complete audit log for all operations';
