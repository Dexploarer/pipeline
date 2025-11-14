import type { PromptTemplate, CompiledPrompt, XMLEvent, ProviderContext, MemoryEntry } from './event-types'

/**
 * Prompt Templates for different agent scenarios
 * Templates compile XML logs into structured prompts for the LLM
 */

/**
 * Decision-making template - for choosing next action
 */
export const decisionTemplate: PromptTemplate = {
  name: 'decision',
  description: 'Template for agent decision-making and action selection',
  template: `You are an AI agent playing a game. Analyze the current situation and decide on the best action.

## Current Context

{{PROVIDER_CONTEXTS}}

## Recent Events (XML Log)

{{EVENT_LOG}}

## Your Memory

{{MEMORY}}

## Instructions

Based on the above information:
1. Analyze the current game state from the XML context
2. Review recent events and what has happened
3. Consider your memories and past learnings
4. Decide on the best action to take
5. Explain your reasoning

Use the available tools to take action. Think strategically and consider your goals.`,
  requiredEvents: ['game_state'],
  providers: ['gameState', 'goals', 'recentEvents'],
  includeMemory: true,
}

/**
 * Exploration template - for discovering new areas
 */
export const explorationTemplate: PromptTemplate = {
  name: 'exploration',
  description: 'Template for exploration and discovery',
  template: `You are an AI agent exploring a game world. Focus on discovery and mapping.

## Current Context

{{PROVIDER_CONTEXTS}}

## Recent Discoveries (XML Log)

{{EVENT_LOG}}

## Exploration Memory

{{MEMORY}}

## Exploration Objectives

Your goal is to:
1. Discover new areas and entities
2. Map the environment
3. Identify points of interest
4. Avoid unnecessary risks while exploring

Based on the XML context and logs, what should you explore next?`,
  requiredEvents: ['game_state', 'observation'],
  providers: ['gameState', 'recentEvents'],
  includeMemory: true,
}

/**
 * Combat template - for combat situations
 */
export const combatTemplate: PromptTemplate = {
  name: 'combat',
  description: 'Template for combat decision-making',
  template: `You are an AI agent in combat. Make tactical decisions to win the fight.

## Battle Context

{{PROVIDER_CONTEXTS}}

## Combat Log (XML)

{{EVENT_LOG}}

## Combat Memory

{{MEMORY}}

## Combat Analysis

Analyze:
1. Enemy positions and threats from XML context
2. Your current health and resources
3. Available combat actions
4. Previous combat experiences

Choose your next combat action tactically.`,
  requiredEvents: ['game_state', 'action'],
  providers: ['gameState', 'performance'],
  includeMemory: true,
}

/**
 * Social template - for NPC interactions
 */
export const socialTemplate: PromptTemplate = {
  name: 'social',
  description: 'Template for social interactions and dialogue',
  template: `You are an AI agent interacting with NPCs. Build relationships and gather information.

## Social Context

{{PROVIDER_CONTEXTS}}

## Conversation Log (XML)

{{EVENT_LOG}}

## Relationship Memory

{{MEMORY}}

## Social Objectives

Focus on:
1. Building positive relationships with NPCs
2. Gathering useful information
3. Accepting quests and opportunities
4. Maintaining consistent personality

Based on the conversation log, how should you respond?`,
  requiredEvents: ['game_state', 'action'],
  providers: ['gameState', 'goals'],
  includeMemory: true,
}

/**
 * Learning template - for post-action evaluation
 */
export const learningTemplate: PromptTemplate = {
  name: 'learning',
  description: 'Template for extracting learnings from events',
  template: `You are analyzing your past actions to learn and improve.

## Event Sequence (XML Log)

{{EVENT_LOG}}

## Current Memory

{{MEMORY}}

## Learning Objectives

Analyze the event log and identify:
1. What worked well (successful patterns)
2. What didn't work (mistakes to avoid)
3. New strategies to try
4. Important facts to remember

Extract key learnings from the XML logs.`,
  requiredEvents: ['action', 'reward'],
  providers: ['performance'],
  includeMemory: true,
}

/**
 * Goal Planning template - for setting and planning goals
 */
export const goalPlanningTemplate: PromptTemplate = {
  name: 'goalPlanning',
  description: 'Template for goal setting and planning',
  template: `You are planning your next objectives in the game.

## Current Situation

{{PROVIDER_CONTEXTS}}

## Recent Progress (XML Log)

{{EVENT_LOG}}

## Goals and Memory

{{MEMORY}}

## Planning Task

Based on your current situation and progress:
1. Evaluate current goal progress
2. Identify new opportunities
3. Plan next steps
4. Prioritize objectives

Create a strategic plan using the XML context.`,
  requiredEvents: ['game_state'],
  providers: ['gameState', 'goals', 'performance'],
  includeMemory: true,
}

/**
 * Prompt Compiler - compiles XML logs and contexts into prompts
 */
export class PromptCompiler {
  /**
   * Compile a prompt from template, events, contexts, and memories
   */
  compile(
    template: PromptTemplate,
    events: XMLEvent[],
    contexts: ProviderContext[],
    memories: MemoryEntry[]
  ): CompiledPrompt {
    let prompt = template.template

    // Replace PROVIDER_CONTEXTS
    const contextXML = this.compileContexts(contexts, template.providers)
    prompt = prompt.replace('{{PROVIDER_CONTEXTS}}', contextXML)

    // Replace EVENT_LOG
    const eventLog = this.compileEventLog(events, template.requiredEvents)
    prompt = prompt.replace('{{EVENT_LOG}}', eventLog)

    // Replace MEMORY
    const memoryXML = template.includeMemory ? this.compileMemory(memories) : ''
    prompt = prompt.replace('{{MEMORY}}', memoryXML)

    return {
      system: this.getSystemPrompt(),
      user: prompt,
      events: events.filter((e) => template.requiredEvents.includes(e.type)),
      contexts: contexts.filter((c) =>
        !template.providers || template.providers.includes(c.providerName)
      ),
      memories: template.includeMemory ? memories : [],
      templateName: template.name,
    }
  }

  /**
   * Compile provider contexts into XML section
   */
  private compileContexts(contexts: ProviderContext[], providerFilter?: string[]): string {
    const filteredContexts = providerFilter
      ? contexts.filter((c) => providerFilter.includes(c.providerName))
      : contexts

    if (filteredContexts.length === 0) {
      return '<contexts><note>No context available</note></contexts>'
    }

    const contextSections = filteredContexts
      .map((context) => {
        return `<!-- Context from ${context.providerName} (priority: ${context.priority}) -->\n${context.xml}`
      })
      .join('\n\n')

    return `<contexts>\n${contextSections}\n</contexts>`
  }

  /**
   * Compile event log into XML section
   */
  private compileEventLog(events: XMLEvent[], eventTypeFilter?: string[]): string {
    const filteredEvents = eventTypeFilter
      ? events.filter((e) => eventTypeFilter.includes(e.type))
      : events

    if (filteredEvents.length === 0) {
      return '<eventLog><note>No events logged</note></eventLog>'
    }

    const eventXML = filteredEvents
      .map((event) => {
        return `<!-- Event: ${event.type} at ${event.timestamp.toISOString()} -->\n${event.xml}`
      })
      .join('\n\n')

    return `<eventLog count="${filteredEvents.length}">\n${eventXML}\n</eventLog>`
  }

  /**
   * Compile memory entries into XML section
   */
  private compileMemory(memories: MemoryEntry[]): string {
    if (memories.length === 0) {
      return '<memory><note>No memories stored</note></memory>'
    }

    // Take most recent and most confident memories
    const relevantMemories = memories
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 20)

    const memoryXML = relevantMemories
      .map((mem) => {
        return `<!-- Memory: ${mem.type} (confidence: ${mem.confidence}) -->\n${mem.xmlContent}`
      })
      .join('\n\n')

    return `<memory count="${relevantMemories.length}">\n${memoryXML}\n</memory>`
  }

  /**
   * Get system prompt for the agent
   */
  private getSystemPrompt(): string {
    return `You are an advanced AI agent that analyzes XML-formatted game logs and makes strategic decisions.

Your inputs will be provided in XML format, including:
- Game state context (positions, entities, inventory, stats)
- Recent event logs (actions taken, rewards received, observations)
- Memory of past learnings and experiences
- Provider contexts with real-time information

Your outputs should:
1. Analyze the XML data carefully
2. Consider your goals and past experiences
3. Make strategic decisions using available tools
4. Explain your reasoning clearly

You have access to game action tools. Use them wisely to achieve your objectives.`
  }
}

/**
 * Template Registry - manages all templates
 */
export class TemplateRegistry {
  private templates: Map<string, PromptTemplate> = new Map()

  register(template: PromptTemplate): void {
    this.templates.set(template.name, template)
  }

  get(name: string): PromptTemplate | undefined {
    return this.templates.get(name)
  }

  getAll(): PromptTemplate[] {
    return Array.from(this.templates.values())
  }
}

/**
 * Create default template registry with all standard templates
 */
export function createDefaultTemplates(): TemplateRegistry {
  const registry = new TemplateRegistry()

  registry.register(decisionTemplate)
  registry.register(explorationTemplate)
  registry.register(combatTemplate)
  registry.register(socialTemplate)
  registry.register(learningTemplate)
  registry.register(goalPlanningTemplate)

  return registry
}

/**
 * Select appropriate template based on game state and recent events
 */
export function selectTemplate(
  gameState: any,
  recentEvents: XMLEvent[]
): string {
  // Check for combat
  const hasEnemies = gameState.visibleEntities?.some((e: any) =>
    ['enemy', 'hostile', 'goblin', 'orc', 'skeleton'].includes(e.type)
  )
  if (hasEnemies) {
    return 'combat'
  }

  // Check for dialogue
  const hasDialogue = gameState.dialogueContext != null
  if (hasDialogue) {
    return 'social'
  }

  // Check for exploration (new area, low activity)
  const exploreEvents = recentEvents.filter((e) => e.type === 'observation')
  if (exploreEvents.length > 2) {
    return 'exploration'
  }

  // Default to decision
  return 'decision'
}
