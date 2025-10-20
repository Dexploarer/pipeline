#!/usr/bin/env ts-node
/**
 * Database Migration Runner
 * Executes schema.sql against the configured database
 */

import { neon } from "@neondatabase/serverless"
import { readFileSync } from "fs"
import { join } from "path"

async function runMigrations(): Promise<void> {
  const databaseUrl =
    process.env["DATABASE_URL"] ||
    process.env["POSTGRES_URL"] ||
    process.env["DATABASE_URL_UNPOOLED"] ||
    process.env["POSTGRES_URL_NON_POOLING"]

  if (!databaseUrl) {
    console.error("❌ No database URL found in environment variables")
    console.error("   Set DATABASE_URL or POSTGRES_URL")
    process.exit(1)
  }

  console.log("🗄️  NPC Content Pipeline - Database Migration")
  console.log("=" .repeat(50))

  try {
    const sql = neon(databaseUrl)

    // Read schema file
    const schemaPath = join(__dirname, "../lib/db/schema.sql")
    const schema = readFileSync(schemaPath, "utf-8")

    console.log("\n📖 Loading schema from:", schemaPath)
    console.log("🔌 Connecting to database...")

    // Execute schema
    console.log("⚙️  Running migrations...")
    const template = Object.assign([schema], { raw: [schema] }) as TemplateStringsArray
    await sql(template)

    console.log("\n✅ Migration completed successfully!")
    console.log("\n📊 Database structure:")
    console.log("   - users (authentication & authorization)")
    console.log("   - zones (world structure)")
    console.log("   - regions (zone groupings)")
    console.log("   - npcs (character definitions)")
    console.log("   - quests (6-layer quest system)")
    console.log("   - dialogue_trees (conversation branching)")
    console.log("   - lore (world lore entries)")
    console.log("   - relationships (NPC relationships)")
    console.log("   - content_packs (ElizaOS bundles)")
    console.log("   - assets (binary file storage)")
    console.log("   - entity_versions (version history)")
    console.log("   - generation_history (AI audit trail)")
    console.log("   - player_states (simulation state)")
    console.log("   - simulation_sessions (testing)")
    console.log("   - audit_log (complete audit trail)")

    console.log("\n🌱 Seed data created:")
    console.log("   - System user (system@npcpipeline.com)")
    console.log("   - Default zone")

    console.log("\n🎉 Database is ready!")

  } catch (error) {
    console.error("\n❌ Migration failed:")
    console.error(error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations()
}

export { runMigrations }
