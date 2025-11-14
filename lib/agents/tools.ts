import { z } from 'zod'
import type { GameState, GameAction, ActionResult, AgentTool } from './types'

/**
 * Game action tools that agents can use
 * These tools allow agents to interact with the game world
 */

/**
 * Movement tool - Move in a direction
 */
export const moveActionTool: AgentTool = {
  name: 'move',
  description: 'Move the agent in a specified direction (north, south, east, west, up, down)',
  parameters: z.object({
    direction: z.enum(['north', 'south', 'east', 'west', 'up', 'down']),
    distance: z.number().optional().describe('Distance to move (default: 1)'),
  }),
  execute: async (parameters, gameState) => {
    const { direction, distance = 1 } = parameters as { direction: string; distance?: number }

    // Simulate movement
    const newPosition = { ...gameState.position }
    switch (direction) {
      case 'north':
        newPosition.y = (newPosition.y || 0) + distance
        break
      case 'south':
        newPosition.y = (newPosition.y || 0) - distance
        break
      case 'east':
        newPosition.x = (newPosition.x || 0) + distance
        break
      case 'west':
        newPosition.x = (newPosition.x || 0) - distance
        break
      case 'up':
        newPosition.z = (newPosition.z || 0) + distance
        break
      case 'down':
        newPosition.z = (newPosition.z || 0) - distance
        break
    }

    return {
      success: true,
      action: { type: 'move', parameters },
      newState: { ...gameState, position: newPosition },
      reward: 0.1, // Small reward for movement
      description: `Moved ${direction} by ${distance} units to position (${newPosition.x}, ${newPosition.y}, ${newPosition.z || 0})`,
    }
  },
}

/**
 * Interact tool - Interact with an entity or object
 */
export const interactTool: AgentTool = {
  name: 'interact',
  description: 'Interact with a nearby entity, NPC, or object by its ID',
  parameters: z.object({
    entityId: z.string().describe('ID of the entity to interact with'),
    action: z.string().optional().describe('Specific interaction action (talk, pickup, use, examine, etc.)'),
  }),
  execute: async (parameters, gameState) => {
    const { entityId, action = 'interact' } = parameters as { entityId: string; action?: string }

    const entity = gameState.visibleEntities.find((e) => e.id === entityId)

    if (!entity) {
      return {
        success: false,
        action: { type: 'interact', parameters },
        newState: gameState,
        reward: -0.5,
        description: `Entity ${entityId} not found or not within range`,
        error: 'Entity not found',
      }
    }

    return {
      success: true,
      action: { type: 'interact', parameters },
      newState: gameState,
      reward: 1.0,
      description: `Interacted with ${entity.type} (${entity.id}) using action: ${action}`,
    }
  },
}

/**
 * Combat tool - Attack an enemy
 */
export const attackTool: AgentTool = {
  name: 'attack',
  description: 'Attack a hostile entity or enemy',
  parameters: z.object({
    targetId: z.string().describe('ID of the target to attack'),
    attackType: z.enum(['melee', 'ranged', 'magic']).optional(),
    weaponId: z.string().optional().describe('ID of weapon/spell to use'),
  }),
  execute: async (parameters, gameState) => {
    const { targetId, attackType = 'melee' } = parameters as { targetId: string; attackType?: string }

    const target = gameState.visibleEntities.find((e) => e.id === targetId)

    if (!target) {
      return {
        success: false,
        action: { type: 'attack', parameters },
        newState: gameState,
        reward: -1.0,
        description: `Target ${targetId} not found`,
        error: 'Target not found',
      }
    }

    // Simulate attack
    const damage = Math.floor(Math.random() * 20) + 10

    return {
      success: true,
      action: { type: 'attack', parameters },
      newState: gameState,
      reward: 5.0,
      description: `Attacked ${target.type} (${target.id}) with ${attackType} attack, dealing ${damage} damage`,
    }
  },
}

/**
 * Use item tool - Use an item from inventory
 */
export const useItemTool: AgentTool = {
  name: 'use_item',
  description: 'Use an item from your inventory',
  parameters: z.object({
    itemId: z.string().describe('ID of the item to use'),
    targetId: z.string().optional().describe('Optional target entity ID'),
  }),
  execute: async (parameters, gameState) => {
    const { itemId, targetId } = parameters as { itemId: string; targetId?: string }

    const item = gameState.inventory.find((i) => i.id === itemId)

    if (!item) {
      return {
        success: false,
        action: { type: 'use_item', parameters },
        newState: gameState,
        reward: -0.5,
        description: `Item ${itemId} not found in inventory`,
        error: 'Item not found',
      }
    }

    // Simulate item use
    const newInventory = gameState.inventory.map((i) =>
      i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
    ).filter((i) => i.quantity > 0)

    return {
      success: true,
      action: { type: 'use_item', parameters },
      newState: { ...gameState, inventory: newInventory },
      reward: 2.0,
      description: targetId
        ? `Used ${item.name} on target ${targetId}`
        : `Used ${item.name}`,
    }
  },
}

/**
 * Dialogue tool - Speak with an NPC
 */
export const speakTool: AgentTool = {
  name: 'speak',
  description: 'Speak with an NPC or respond in a dialogue',
  parameters: z.object({
    npcId: z.string().describe('ID of the NPC to speak with'),
    message: z.string().describe('What to say to the NPC'),
  }),
  execute: async (parameters, gameState) => {
    const { npcId, message } = parameters as { npcId: string; message: string }

    const npc = gameState.visibleEntities.find((e) => e.id === npcId)

    if (!npc) {
      return {
        success: false,
        action: { type: 'speak', parameters },
        newState: gameState,
        reward: -0.5,
        description: `NPC ${npcId} not found nearby`,
        error: 'NPC not found',
      }
    }

    // Update dialogue context
    const newDialogueContext = {
      npcName: npc.properties.name as string || 'Unknown NPC',
      npcId,
      conversationHistory: [
        ...(gameState.dialogueContext?.conversationHistory || []),
        { speaker: 'agent' as const, message },
      ],
    }

    return {
      success: true,
      action: { type: 'speak', parameters },
      newState: { ...gameState, dialogueContext: newDialogueContext },
      reward: 1.5,
      description: `Spoke with ${newDialogueContext.npcName}: "${message}"`,
    }
  },
}

/**
 * Quest tool - Accept, check, or complete quests
 */
export const questTool: AgentTool = {
  name: 'quest_action',
  description: 'Perform quest-related actions (accept, check_progress, complete)',
  parameters: z.object({
    questId: z.string().describe('ID of the quest'),
    action: z.enum(['accept', 'check_progress', 'complete', 'abandon']),
  }),
  execute: async (parameters, gameState) => {
    const { questId, action } = parameters as { questId: string; action: string }

    const quest = gameState.activeQuests.find((q) => q.id === questId)

    let description = ''
    let reward = 0

    switch (action) {
      case 'accept':
        reward = 2.0
        description = `Accepted quest: ${questId}`
        break
      case 'check_progress':
        reward = 0.5
        description = quest
          ? `Quest progress: ${quest.objectives.filter((o) => o.completed).length}/${quest.objectives.length} objectives completed`
          : `Quest ${questId} not found`
        break
      case 'complete':
        reward = 10.0
        description = `Completed quest: ${questId}! Received rewards.`
        break
      case 'abandon':
        reward = -2.0
        description = `Abandoned quest: ${questId}`
        break
    }

    return {
      success: true,
      action: { type: 'quest_action', parameters },
      newState: gameState,
      reward,
      description,
    }
  },
}

/**
 * Inventory management tool
 */
export const inventoryTool: AgentTool = {
  name: 'inventory_action',
  description: 'Manage inventory (pickup, drop, equip, unequip)',
  parameters: z.object({
    action: z.enum(['pickup', 'drop', 'equip', 'unequip', 'inspect']),
    itemId: z.string().optional().describe('ID of item (for drop/equip/unequip/inspect)'),
    entityId: z.string().optional().describe('ID of entity to pickup from'),
  }),
  execute: async (parameters, gameState) => {
    const { action, itemId, entityId } = parameters as {
      action: string
      itemId?: string
      entityId?: string
    }

    let description = ''
    let reward = 0

    switch (action) {
      case 'pickup':
        reward = 1.0
        description = `Picked up item from entity ${entityId}`
        break
      case 'drop':
        reward = 0.0
        description = `Dropped item ${itemId}`
        break
      case 'equip':
        reward = 1.5
        description = `Equipped item ${itemId}`
        break
      case 'unequip':
        reward = 0.0
        description = `Unequipped item ${itemId}`
        break
      case 'inspect':
        reward = 0.1
        description = `Inspected item ${itemId}`
        break
    }

    return {
      success: true,
      action: { type: 'inventory_action', parameters },
      newState: gameState,
      reward,
      description,
    }
  },
}

/**
 * Wait/observe tool - Take no action and observe
 */
export const waitTool: AgentTool = {
  name: 'wait',
  description: 'Wait and observe the environment without taking action',
  parameters: z.object({
    duration: z.number().optional().describe('How long to wait (seconds)'),
    reason: z.string().optional().describe('Reason for waiting'),
  }),
  execute: async (parameters, gameState) => {
    const { duration = 1, reason = 'Observing' } = parameters as { duration?: number; reason?: string }

    return {
      success: true,
      action: { type: 'wait', parameters },
      newState: gameState,
      reward: 0.0,
      description: `Waited for ${duration} seconds. ${reason}`,
    }
  },
}

/**
 * All available game action tools
 */
export const gameActionTools: AgentTool[] = [
  moveActionTool,
  interactTool,
  attackTool,
  useItemTool,
  speakTool,
  questTool,
  inventoryTool,
  waitTool,
]

/**
 * Convert agent tools to AI SDK tool format
 */
export function convertToAISDKTools(tools: AgentTool[]) {
  return tools.reduce((acc, tool) => {
    acc[tool.name] = {
      description: tool.description,
      parameters: tool.parameters,
    }
    return acc
  }, {} as Record<string, { description: string; parameters: unknown }>)
}
