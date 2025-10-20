/**
 * Unified Export Manager
 * Handles all export formats: JSON, TypeScript, YAML, CSV, Game Engine formats
 */

import type {
  NPCScript,
  DialogueNode,
  QuestDefinition,
  WorldZone,
  ContentPack,
} from "../npc-types"
import type { LoreEntry } from "../db/repositories/lore"
import { createGameIntegration, type GameIntegrationConfig, GameEngine } from "../game/integration-service"

// ============================================================================
// EXPORT TYPES
// ============================================================================

export enum ExportFormat {
  JSON = "json",
  TYPESCRIPT = "typescript",
  YAML = "yaml",
  CSV = "csv",
  MARKDOWN = "markdown",
  UNITY = "unity",
  UNREAL = "unreal",
  GODOT = "godot",
  ELIZAOS = "elizaos",
  NPM_PACKAGE = "npm_package",
}

export interface ExportOptions {
  format: ExportFormat
  pretty?: boolean
  includeMetadata?: boolean
  includeAssets?: boolean
  compress?: boolean
  gameEngineConfig?: GameIntegrationConfig
}

export interface ExportResult {
  success: boolean
  data?: any
  filename: string
  mimeType: string
  size: number
  error?: string
}

// ============================================================================
// UNIFIED EXPORTER CLASS
// ============================================================================

export class UnifiedExporter {
  /**
   * Export single NPC
   */
  async exportNPC(npc: NPCScript, options: ExportOptions): Promise<ExportResult> {
    try {
      switch (options.format) {
        case ExportFormat.JSON:
          return this.exportAsJSON(npc, "npc", options)

        case ExportFormat.TYPESCRIPT:
          return this.exportAsTypeScript(npc, "npc", options)

        case ExportFormat.YAML:
          return this.exportAsYAML(npc, "npc", options)

        case ExportFormat.CSV:
          return this.exportNPCAsCSV([npc], options)

        case ExportFormat.MARKDOWN:
          return this.exportNPCAsMarkdown(npc, options)

        case ExportFormat.UNITY:
        case ExportFormat.UNREAL:
        case ExportFormat.GODOT:
        case ExportFormat.ELIZAOS:
          return await this.exportToGameEngine(npc, options)

        default:
          throw new Error(`Unsupported export format: ${options.format}`)
      }
    } catch (error) {
      return {
        success: false,
        filename: "",
        mimeType: "",
        size: 0,
        error: error instanceof Error ? error.message : "Export failed",
      }
    }
  }

  /**
   * Export multiple NPCs
   */
  async exportNPCs(npcs: NPCScript[], options: ExportOptions): Promise<ExportResult> {
    if (options.format === ExportFormat.CSV) {
      return this.exportNPCAsCSV(npcs, options)
    }

    return this.exportAsJSON(npcs, "npcs", options)
  }

  /**
   * Export quest
   */
  async exportQuest(quest: QuestDefinition, options: ExportOptions): Promise<ExportResult> {
    switch (options.format) {
      case ExportFormat.JSON:
        return this.exportAsJSON(quest, "quest", options)

      case ExportFormat.TYPESCRIPT:
        return this.exportAsTypeScript(quest, "quest", options)

      case ExportFormat.YAML:
        return this.exportAsYAML(quest, "quest", options)

      case ExportFormat.MARKDOWN:
        return this.exportQuestAsMarkdown(quest, options)

      default:
        return this.exportAsJSON(quest, "quest", options)
    }
  }

  /**
   * Export dialogue tree
   */
  async exportDialogue(dialogue: DialogueNode[], options: ExportOptions): Promise<ExportResult> {
    return this.exportAsJSON(dialogue, "dialogue", options)
  }

  /**
   * Export lore
   */
  async exportLore(lore: LoreEntry[], options: ExportOptions): Promise<ExportResult> {
    if (options.format === ExportFormat.MARKDOWN) {
      return this.exportLoreAsMarkdown(lore, options)
    }

    return this.exportAsJSON(lore, "lore", options)
  }

  /**
   * Export zone with all content
   */
  async exportZone(
    zone: WorldZone,
    content: {
      npcs?: NPCScript[]
      quests?: QuestDefinition[]
      lore?: LoreEntry[]
      dialogues?: DialogueNode[][]
    },
    options: ExportOptions
  ): Promise<ExportResult> {
    const zoneData = {
      zone,
      ...content,
      metadata: options.includeMetadata ? {
        exportDate: new Date().toISOString(),
        format: options.format,
      } : undefined,
    }

    return this.exportAsJSON(zoneData, `zone_${zone.name}`, options)
  }

  /**
   * Export content pack
   */
  async exportContentPack(pack: ContentPack, options: ExportOptions): Promise<ExportResult> {
    if (options.format === ExportFormat.NPM_PACKAGE) {
      return this.exportAsNPMPackage(pack, options)
    }

    return this.exportAsJSON(pack, `pack_${pack.name}`, options)
  }

  // ============================================================================
  // FORMAT-SPECIFIC EXPORTERS
  // ============================================================================

  /**
   * Export as JSON
   */
  private exportAsJSON(data: any, basename: string, options: ExportOptions): ExportResult {
    const json = options.pretty
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data)

    const size = typeof TextEncoder !== "undefined"
      ? new TextEncoder().encode(json).length
      : Buffer.byteLength(json, "utf8")

    return {
      success: true,
      data: json,
      filename: `${basename}.json`,
      mimeType: "application/json",
      size,
    }
  }

  /**
   * Export as TypeScript
   */
  private exportAsTypeScript(data: any, basename: string, _options: ExportOptions): ExportResult {
    const variableName = this.toCamelCase(basename)
    const typescript = `export const ${variableName} = ${JSON.stringify(data, null, 2)} as const;`

    const size = typeof TextEncoder !== "undefined"
      ? new TextEncoder().encode(typescript).length
      : Buffer.byteLength(typescript, "utf8")

    return {
      success: true,
      data: typescript,
      filename: `${basename}.ts`,
      mimeType: "text/typescript",
      size,
    }
  }

  /**
   * Export as YAML
   */
  private exportAsYAML(data: any, basename: string, _options: ExportOptions): ExportResult {
    const yaml = this.jsonToYAML(data, 0)

    const size = typeof TextEncoder !== "undefined"
      ? new TextEncoder().encode(yaml).length
      : Buffer.byteLength(yaml, "utf8")

    return {
      success: true,
      data: yaml,
      filename: `${basename}.yaml`,
      mimeType: "text/yaml",
      size,
    }
  }

  /**
   * Export NPCs as CSV
   */
  private exportNPCAsCSV(npcs: NPCScript[], _options: ExportOptions): ExportResult {
    const headers = [
      "Name",
      "Archetype",
      "Background",
      "Traits",
      "Speech Pattern",
      "Motivations",
      "Goals",
    ]

    const rows = npcs.map(npc => [
      npc.personality.name,
      npc.personality.archetype,
      "",  // background field doesn't exist on NPCPersonality
      (npc.personality.traits ?? []).join("; "),
      "",  // speechPattern field doesn't exist on NPCPersonality
      "",  // motivations field doesn't exist on NPCPersonality
      (npc.personality.goals ?? []).join("; "),
    ])

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")),
    ].join("\n")

    const size = typeof TextEncoder !== "undefined"
      ? new TextEncoder().encode(csv).length
      : Buffer.byteLength(csv, "utf8")

    return {
      success: true,
      data: csv,
      filename: "npcs.csv",
      mimeType: "text/csv",
      size,
    }
  }

  /**
   * Export NPC as Markdown
   */
  private exportNPCAsMarkdown(npc: NPCScript, _options: ExportOptions): ExportResult {
    const p = npc.personality

    const md = `# ${p.name}

## Overview
- **Archetype:** ${p.archetype}

## Personality
**Traits:** ${(p.traits ?? []).join(", ")}

## Goals
${(p.goals ?? []).map(g => `- ${g}`).join("\n")}

## Dialogues
${(npc.dialogues ?? []).map((d, i) => `### Dialogue ${i + 1}\n**Text:** ${d.text}`).join("\n\n")}

## Quests
${(npc.quests ?? []).map(q => `### ${q.title}\n${q.description ?? ""}`).join("\n\n")}

---
*Generated by NPC Content Pipeline*
`

    const size = typeof TextEncoder !== "undefined"
      ? new TextEncoder().encode(md).length
      : Buffer.byteLength(md, "utf8")

    return {
      success: true,
      data: md,
      filename: `${p.name.replace(/\s+/g, "_")}.md`,
      mimeType: "text/markdown",
      size,
    }
  }

  /**
   * Export quest as Markdown
   */
  private exportQuestAsMarkdown(quest: QuestDefinition, _options: ExportOptions): ExportResult {
    const md = `# ${quest.title}

${quest.description ?? ""}

## Objectives
${quest.objectives.map((obj, i) => `${i + 1}. ${obj.description}`).join("\n")}

## Rewards
${Object.entries(quest.rewards ?? {}).map(([key, value]) => `- **${key}:** ${value}`).join("\n")}

---
*Generated by NPC Content Pipeline*
`

    const size = typeof TextEncoder !== "undefined"
      ? new TextEncoder().encode(md).length
      : Buffer.byteLength(md, "utf8")

    return {
      success: true,
      data: md,
      filename: `${quest.title.replace(/\s+/g, "_")}.md`,
      mimeType: "text/markdown",
      size,
    }
  }

  /**
   * Export lore as Markdown
   */
  private exportLoreAsMarkdown(lore: LoreEntry[], _options: ExportOptions): ExportResult {
    const md = `# Lore Compendium

${lore.map(entry => `## ${entry.title}

**Category:** ${entry.category}
**Tags:** ${entry.tags.join(", ")}

${entry.content}

---
`).join("\n")}

*Generated by NPC Content Pipeline*
`

    const size = typeof TextEncoder !== "undefined"
      ? new TextEncoder().encode(md).length
      : Buffer.byteLength(md, "utf8")

    return {
      success: true,
      data: md,
      filename: "lore_compendium.md",
      mimeType: "text/markdown",
      size,
    }
  }

  /**
   * Export to game engine format
   */
  private async exportToGameEngine(npc: NPCScript, options: ExportOptions): Promise<ExportResult> {
    const config = options.gameEngineConfig ?? {
      engine: options.format as unknown as GameEngine,
      syncMode: "pull",
      format: "json",
    }

    const integrationService = createGameIntegration(config)
    const gameData = await integrationService.convertNPC(npc)

    return this.exportAsJSON(gameData, `npc_${npc.personality.name}_${options.format}`, options)
  }

  /**
   * Export as NPM package
   */
  private exportAsNPMPackage(pack: ContentPack, options: ExportOptions): ExportResult {
    // This would create a complete package structure
    // For now, return metadata
    const packageData = {
      name: `@game-content/${pack.name.toLowerCase().replace(/\s+/g, "-")}`,
      version: pack.version ?? "1.0.0",
      description: pack.description,
      main: "./dist/index.js",
      types: "./dist/index.d.ts",
      files: ["dist"],
      keywords: ["game-content", "npc", pack.name],
      content: pack,
    }

    return this.exportAsJSON(packageData, `package_${pack.name}`, options)
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private toCamelCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
        index === 0 ? word.toLowerCase() : word.toUpperCase()
      )
      .replace(/\s+/g, "")
  }

  private jsonToYAML(obj: any, indent: number): string {
    const spaces = "  ".repeat(indent)
    let yaml = ""

    if (Array.isArray(obj)) {
      obj.forEach(item => {
        if (typeof item === "object") {
          yaml += `${spaces}-\n${this.jsonToYAML(item, indent + 1)}`
        } else {
          yaml += `${spaces}- ${item}\n`
        }
      })
    } else if (obj && typeof obj === "object") {
      Object.entries(obj).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          yaml += `${spaces}${key}: null\n`
        } else if (Array.isArray(value)) {
          yaml += `${spaces}${key}:\n${this.jsonToYAML(value, indent + 1)}`
        } else if (typeof value === "object") {
          yaml += `${spaces}${key}:\n${this.jsonToYAML(value, indent + 1)}`
        } else if (typeof value === "string") {
          yaml += `${spaces}${key}: "${value}"\n`
        } else {
          yaml += `${spaces}${key}: ${value}\n`
        }
      })
    }

    return yaml
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createExporter(): UnifiedExporter {
  return new UnifiedExporter()
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export async function exportToFile(
  data: any,
  type: "npc" | "quest" | "dialogue" | "lore" | "zone" | "pack",
  format: ExportFormat,
  options: Partial<ExportOptions> = {}
): Promise<ExportResult> {
  const exporter = createExporter()
  const fullOptions: ExportOptions = {
    format,
    pretty: true,
    includeMetadata: true,
    ...options,
  }

  switch (type) {
    case "npc":
      return exporter.exportNPC(data, fullOptions)
    case "quest":
      return exporter.exportQuest(data, fullOptions)
    case "dialogue":
      return exporter.exportDialogue(data, fullOptions)
    case "lore":
      return exporter.exportLore(data, fullOptions)
    case "pack":
      return exporter.exportContentPack(data, fullOptions)
    default:
      throw new Error(`Unknown export type: ${type}`)
  }
}

export function downloadExportedFile(result: ExportResult): void {
  if (!result.success || !result.data) {
    console.error("Export failed:", result.error)
    return
  }

  const blob = new Blob([result.data], { type: result.mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = result.filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
