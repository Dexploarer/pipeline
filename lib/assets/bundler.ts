import { put } from "@vercel/blob"
import type { ContentPack } from "../npc-types"
import * as npcRepo from "../db/repositories/npcs"
import * as questRepo from "../db/repositories/quests"
import * as loreRepo from "../db/repositories/lore"
import * as zoneRepo from "../db/repositories/zones"

export interface BundleManifest {
  name: string
  version: string
  description?: string
  createdAt: string
  zones: any[]
  npcs: any[]
  quests: any[]
  lore: any[]
  assets: {
    [key: string]: string
  }
}

// Create content pack bundle
export async function createContentPackBundle(pack: ContentPack): Promise<string> {
  try {
    // Fetch all entities
    const zones = await Promise.all((pack.zoneIds || []).map((id) => zoneRepo.getZone(id)))
    const npcs = await Promise.all((pack.npcIds || []).map((id) => npcRepo.getNPC(id)))
    const quests = await Promise.all((pack.questIds || []).map((id) => questRepo.getQuest(id)))
    const lore = await Promise.all((pack.loreIds || []).map((id) => loreRepo.getLoreEntry(id)))

    // Create manifest
    const manifest: BundleManifest = {
      name: pack.name,
      version: pack.version,
      description: pack.description,
      createdAt: new Date().toISOString(),
      zones: zones.filter(Boolean),
      npcs: npcs.filter(Boolean),
      quests: quests.filter(Boolean),
      lore: lore.filter(Boolean),
      assets: {},
    }

    // Convert to JSON
    const manifestJson = JSON.stringify(manifest, null, 2)

    // Upload manifest
    const manifestBlob = await put(`content-packs/${pack.id}/manifest.json`, manifestJson, {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    })

    console.log(`[v0] Created content pack bundle: ${pack.name}`)
    return manifestBlob.url
  } catch (error) {
    console.error("[v0] Bundle creation error:", error)
    throw error
  }
}

// Parse and import content pack
export async function importContentPack(manifestUrl: string): Promise<BundleManifest> {
  try {
    const response = await fetch(manifestUrl)
    const manifest: BundleManifest = await response.json()

    console.log(`[v0] Imported content pack: ${manifest.name}`)
    return manifest
  } catch (error) {
    console.error("[v0] Bundle import error:", error)
    throw error
  }
}
