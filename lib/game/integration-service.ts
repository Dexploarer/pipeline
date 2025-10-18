/**
 * Game Integration Service
 * Complete integration layer for connecting NPC Content Pipeline to game engines
 * Supports Unity, Unreal, Godot, and custom engines via standardized interfaces
 */

import type {
  NPCScript,
  DialogueNode,
  QuestDefinition,
  WorldZone,
  ContentPack,
  NPCBehavior,
} from "../npc-types"
import type { IContentPack } from "../types/content-pack"

// ============================================================================
// GAME ENGINE TYPES
// ============================================================================

export enum GameEngine {
  UNITY = "unity",
  UNREAL = "unreal",
  GODOT = "godot",
  CUSTOM = "custom",
  ELIZAOS = "elizaos",
}

export interface GameIntegrationConfig {
  engine: GameEngine
  apiEndpoint?: string
  apiKey?: string
  webhookUrl?: string
  syncMode: "push" | "pull" | "webhook"
  format: "json" | "binary" | "custom"
  compression?: "gzip" | "brotli" | "none"
}

// ============================================================================
// SERIALIZATION FORMATS
// ============================================================================

/**
 * Unity-compatible NPC format (C# MonoBehaviour structure)
 */
export interface UnityNPCData {
  id: string
  name: string
  prefabPath: string
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number; w: number }
  archetype: string
  stats: {
    health: number
    maxHealth: number
    level: number
    attributes: Record<string, number>
  }
  personality: {
    traits: string[]
    values: Record<string, number>
  }
  dialogueTree: {
    rootNodeId: string
    nodes: Array<{
      id: string
      text: string
      speaker: string
      nextNodeIds: string[]
      conditions: string[]
      actions: string[]
    }>
  }
  behavior: {
    aiType: string
    patrolPoints: Array<{ x: number; y: number; z: number }>
    aggression: number
    socialDistance: number
    wanderRadius: number
  }
  quests: Array<{
    id: string
    title: string
    isAvailable: boolean
  }>
  inventory: Array<{
    itemId: string
    quantity: number
  }>
  lootTable: {
    itemPoolId: string
    dropChance: number
  }
}

/**
 * Unreal Engine Blueprint-compatible format
 */
export interface UnrealNPCData {
  NPCId: string
  DisplayName: string
  BlueprintClass: string
  SpawnTransform: {
    Translation: { X: number; Y: number; Z: number }
    Rotation: { Pitch: number; Yaw: number; Roll: number }
    Scale3D: { X: number; Y: number; Z: number }
  }
  CharacterStats: {
    CurrentHealth: number
    MaxHealth: number
    Level: number
    AttributeMap: Record<string, number>
  }
  PersonalityTraits: {
    TraitNames: string[]
    TraitValues: Record<string, number>
  }
  DialogueComponent: {
    DialogueAsset: string
    RootConversationId: string
  }
  AIBehaviorTree: string
  QuestProvider: {
    AvailableQuests: string[]
  }
  InventoryComponent: {
    Items: Array<{ ItemClass: string; Quantity: number }>
  }
}

/**
 * Godot-compatible format (GDScript)
 */
export interface GodotNPCData {
  id: string
  name: string
  scene_path: string
  transform: {
    origin: { x: number; y: number; z: number }
    basis: {
      x: { x: number; y: number; z: number }
      y: { x: number; y: number; z: number }
      z: { x: number; y: number; z: number }
    }
  }
  archetype: string
  stats: Record<string, number>
  personality: Record<string, any>
  dialogue_tree: {
    root_node: string
    nodes: Record<string, any>
  }
  behavior_tree: string
  quests: string[]
  inventory: Array<{ item: string; count: number }>
}

/**
 * ElizaOS-compatible format
 */
export interface ElizaOSNPCData {
  character: {
    name: string
    username?: string
    bio: string | string[]
    lore: string[]
    messageExamples: any[]
    postExamples: string[]
    topics: string[]
    adjectives: string[]
    style: {
      all: string[]
      chat: string[]
      post: string[]
    }
  }
  plugins: IContentPack[]
  customActions?: any[]
  customProviders?: any[]
  customEvaluators?: any[]
}

// ============================================================================
// CONVERSION FUNCTIONS
// ============================================================================

export class GameIntegrationService {
  constructor(private config: GameIntegrationConfig) {}

  /**
   * Convert NPC Script to game engine format
   */
  async convertNPC(npc: NPCScript, zone?: WorldZone): Promise<any> {
    switch (this.config.engine) {
      case GameEngine.UNITY:
        return this.toUnityFormat(npc, zone)
      case GameEngine.UNREAL:
        return this.toUnrealFormat(npc, zone)
      case GameEngine.GODOT:
        return this.toGodotFormat(npc, zone)
      case GameEngine.ELIZAOS:
        return this.toElizaOSFormat(npc)
      default:
        return this.toGenericFormat(npc, zone)
    }
  }

  /**
   * Convert to Unity format
   */
  private toUnityFormat(npc: NPCScript, zone?: WorldZone): UnityNPCData {
    const personality = npc.personality
    const behavior = npc.behavior ?? {}

    return {
      id: crypto.randomUUID(),
      name: personality.name,
      prefabPath: `Assets/Prefabs/NPCs/${npc.personality.archetype}`,
      position: zone?.coordinates ?? { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      archetype: personality.archetype,
      stats: {
        health: 100,
        maxHealth: 100,
        level: 1,
        attributes: {
          strength: 10,
          intelligence: 10,
          charisma: 10,
          agility: 10,
        },
      },
      personality: {
        traits: personality.traits ?? [],
        values: {
          friendliness: 0.5,
          aggression: 0.3,
          curiosity: 0.7,
        },
      },
      dialogueTree: {
        rootNodeId: "node_0",
        nodes: this.convertDialogueToUnity(npc.dialogues ?? []),
      },
      behavior: {
        aiType: behavior.type ?? "passive",
        patrolPoints: behavior.patrolPoints ?? [],
        aggression: behavior.aggression ?? 0,
        socialDistance: behavior.interactionDistance ?? 2.0,
        wanderRadius: behavior.wanderRadius ?? 10.0,
      },
      quests: (npc.quests ?? []).map(q => ({
        id: crypto.randomUUID(),
        title: q.title,
        isAvailable: true,
      })),
      inventory: [],
      lootTable: {
        itemPoolId: `loot_${personality.archetype}`,
        dropChance: 0.5,
      },
    }
  }

  /**
   * Convert to Unreal Engine format
   */
  private toUnrealFormat(npc: NPCScript, zone?: WorldZone): UnrealNPCData {
    const personality = npc.personality
    const pos = zone?.coordinates ?? { x: 0, y: 0, z: 0 }

    return {
      NPCId: crypto.randomUUID(),
      DisplayName: personality.name,
      BlueprintClass: `/Game/Blueprints/NPCs/BP_${personality.archetype}`,
      SpawnTransform: {
        Translation: { X: pos.x, Y: pos.y, Z: pos.z },
        Rotation: { Pitch: 0, Yaw: 0, Roll: 0 },
        Scale3D: { X: 1, Y: 1, Z: 1 },
      },
      CharacterStats: {
        CurrentHealth: 100,
        MaxHealth: 100,
        Level: 1,
        AttributeMap: {
          Strength: 10,
          Intelligence: 10,
          Charisma: 10,
        },
      },
      PersonalityTraits: {
        TraitNames: personality.traits ?? [],
        TraitValues: {
          Friendliness: 0.5,
          Aggression: 0.3,
        },
      },
      DialogueComponent: {
        DialogueAsset: `/Game/Dialogue/${personality.name.replace(/\s+/g, "_")}`,
        RootConversationId: "conv_root",
      },
      AIBehaviorTree: `/Game/AI/BehaviorTrees/BT_${personality.archetype}`,
      QuestProvider: {
        AvailableQuests: (npc.quests ?? []).map(q => q.title),
      },
      InventoryComponent: {
        Items: [],
      },
    }
  }

  /**
   * Convert to Godot format
   */
  private toGodotFormat(npc: NPCScript, zone?: WorldZone): GodotNPCData {
    const personality = npc.personality
    const pos = zone?.coordinates ?? { x: 0, y: 0, z: 0 }

    return {
      id: crypto.randomUUID(),
      name: personality.name,
      scene_path: `res://scenes/npcs/${personality.archetype}.tscn`,
      transform: {
        origin: pos,
        basis: {
          x: { x: 1, y: 0, z: 0 },
          y: { x: 0, y: 1, z: 0 },
          z: { x: 0, y: 0, z: 1 },
        },
      },
      archetype: personality.archetype,
      stats: {
        health: 100,
        max_health: 100,
        level: 1,
      },
      personality: {
        traits: personality.traits ?? [],
        background: personality.background,
      },
      dialogue_tree: {
        root_node: "node_0",
        nodes: this.convertDialogueToGodot(npc.dialogues ?? []),
      },
      behavior_tree: `res://ai/behaviors/${personality.archetype}.tres`,
      quests: (npc.quests ?? []).map(q => q.title),
      inventory: [],
    }
  }

  /**
   * Convert to ElizaOS format
   */
  private toElizaOSFormat(npc: NPCScript): ElizaOSNPCData {
    const personality = npc.personality

    return {
      character: {
        name: personality.name,
        username: personality.name.toLowerCase().replace(/\s+/g, "_"),
        bio: [
          personality.background ?? "",
          personality.motivations ?? "",
          personality.quirks ?? "",
        ].filter(Boolean),
        lore: [
          `${personality.name} is a ${personality.archetype}.`,
          personality.background ?? "",
        ].filter(Boolean),
        messageExamples: this.convertDialogueToElizaExamples(npc.dialogues ?? []),
        postExamples: [],
        topics: personality.traits ?? [],
        adjectives: personality.traits ?? [],
        style: {
          all: [personality.speechPattern ?? "conversational"],
          chat: [personality.speechPattern ?? "friendly"],
          post: ["casual"],
        },
      },
      plugins: npc.elizaOSConfig?.plugins ?? [],
      customActions: npc.elizaOSConfig?.actions,
      customProviders: npc.elizaOSConfig?.providers,
      customEvaluators: npc.elizaOSConfig?.evaluators,
    }
  }

  /**
   * Generic JSON format
   */
  private toGenericFormat(npc: NPCScript, zone?: WorldZone): any {
    return {
      id: crypto.randomUUID(),
      name: npc.personality.name,
      archetype: npc.personality.archetype,
      zone: zone?.name,
      position: zone?.coordinates,
      personality: npc.personality,
      behavior: npc.behavior,
      dialogues: npc.dialogues,
      quests: npc.quests,
      elizaOSConfig: npc.elizaOSConfig,
    }
  }

  /**
   * Convert dialogue nodes to Unity format
   */
  private convertDialogueToUnity(dialogues: DialogueNode[]): UnityNPCData["dialogueTree"]["nodes"] {
    return dialogues.map((node, index) => ({
      id: node.id || `node_${index}`,
      text: node.text,
      speaker: node.speaker,
      nextNodeIds: node.responses?.map(r => r.id || "") ?? [],
      conditions: node.conditions ? [JSON.stringify(node.conditions)] : [],
      actions: node.actions ?? [],
    }))
  }

  /**
   * Convert dialogue nodes to Godot format
   */
  private convertDialogueToGodot(dialogues: DialogueNode[]): Record<string, any> {
    const nodes: Record<string, any> = {}
    dialogues.forEach((node, index) => {
      nodes[node.id || `node_${index}`] = {
        text: node.text,
        speaker: node.speaker,
        next_nodes: node.responses?.map(r => r.id || "") ?? [],
        conditions: node.conditions,
        actions: node.actions,
      }
    })
    return nodes
  }

  /**
   * Convert dialogue to ElizaOS message examples
   */
  private convertDialogueToElizaExamples(dialogues: DialogueNode[]): any[] {
    return dialogues.slice(0, 5).map(node => [
      {
        user: "{{user1}}",
        content: {
          text: node.responses?.[0]?.text ?? "Hello!",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: node.text,
        },
      },
    ])
  }

  /**
   * Batch convert multiple NPCs
   * @param npcs - Array of NPC scripts to convert
   * @param zones - Map of zone IDs to WorldZone objects. The key should be the NPC's zone ID.
   */
  async convertNPCBatch(npcs: NPCScript[], zones?: Map<string, WorldZone>): Promise<any[]> {
    return Promise.all(
      npcs.map(npc => {
        // Look up zone by NPC ID (assumes zones map uses NPC IDs as keys)
        // Caller should provide a map with appropriate keys (e.g., npc.id -> zone or zoneId -> zone)
        const zone = zones?.get(npc.id)
        return this.convertNPC(npc, zone)
      })
    )
  }

  /**
   * Export zone with all NPCs and quests
   */
  async exportZone(
    zone: WorldZone,
    npcs: NPCScript[],
    quests: QuestDefinition[]
  ): Promise<any> {
    const convertedNPCs = await this.convertNPCBatch(npcs)

    return {
      zone: {
        id: zone.id,
        name: zone.name,
        description: zone.description,
        type: zone.type,
        dangerLevel: zone.dangerLevel,
        coordinates: zone.coordinates,
        factions: zone.factions,
      },
      npcs: convertedNPCs,
      quests: quests.map(q => this.convertQuest(q)),
      metadata: {
        exportDate: new Date().toISOString(),
        engine: this.config.engine,
        version: "1.0.0",
      },
    }
  }

  /**
   * Convert quest to game format
   */
  private convertQuest(quest: QuestDefinition): any {
    return {
      id: crypto.randomUUID(),
      title: quest.title,
      description: quest.description,
      objectives: quest.objectives,
      rewards: quest.rewards,
      requirements: quest.requirements,
      layers: {
        gameflow: quest.gameflowLayer,
        lore: quest.loreLayer,
        history: quest.historyLayer,
        relationships: quest.relationshipsLayer,
        economy: quest.economyLayer,
        worldEvents: quest.worldEventsLayer,
      },
    }
  }

  /**
   * Export content pack for game engine
   */
  async exportContentPack(contentPack: ContentPack): Promise<any> {
    return {
      id: contentPack.id,
      name: contentPack.name,
      version: contentPack.version,
      description: contentPack.description,
      zones: contentPack.zones,
      npcs: contentPack.npcs?.length ?? 0,
      quests: contentPack.quests?.length ?? 0,
      dialogues: contentPack.dialogues?.length ?? 0,
      assets: contentPack.assets,
      metadata: {
        engine: this.config.engine,
        exportDate: new Date().toISOString(),
      },
    }
  }

  /**
   * Send to game engine API
   */
  async syncToEngine(data: any): Promise<{ success: boolean; message: string }> {
    if (!this.config.apiEndpoint) {
      throw new Error("No API endpoint configured")
    }

    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.config.apiKey && { "X-API-Key": this.config.apiKey }),
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return {
        success: true,
        message: "Successfully synced to game engine",
      }
    } catch (error) {
      console.error("Failed to sync to engine:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createGameIntegration(config: GameIntegrationConfig): GameIntegrationService {
  return new GameIntegrationService(config)
}

// ============================================================================
// PRESET CONFIGURATIONS
// ============================================================================

export const UNITY_CONFIG: GameIntegrationConfig = {
  engine: GameEngine.UNITY,
  syncMode: "push",
  format: "json",
  compression: "gzip",
}

export const UNREAL_CONFIG: GameIntegrationConfig = {
  engine: GameEngine.UNREAL,
  syncMode: "push",
  format: "json",
  compression: "gzip",
}

export const GODOT_CONFIG: GameIntegrationConfig = {
  engine: GameEngine.GODOT,
  syncMode: "push",
  format: "json",
  compression: "none",
}

export const ELIZAOS_CONFIG: GameIntegrationConfig = {
  engine: GameEngine.ELIZAOS,
  syncMode: "pull",
  format: "json",
  compression: "none",
}
