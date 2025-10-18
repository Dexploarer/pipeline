import type { ContextSource } from "./npc-types"
import type { ContextInjectionRule } from "./npc-types"
import type { LayeredQuest } from "./npc-types"

export class ContextEngine {
  private contextSources: Map<string, ContextSource> = new Map()
  private injectionRules: ContextInjectionRule[] = []

  addContextSource(source: ContextSource) {
    this.contextSources.set(source.id, source)
  }

  addInjectionRule(rule: ContextInjectionRule) {
    this.injectionRules.push(rule)
    this.injectionRules.sort((a, b) => b.priority - a.priority)
  }

  getRelatedContext(tags: string[], types?: ContextSource["type"][]): ContextSource[] {
    return Array.from(this.contextSources.values()).filter((source) => {
      const matchesTags = tags.some((tag) => source.tags.includes(tag))
      const matchesType = !types || types.includes(source.type)
      return matchesTags && matchesType
    })
  }

  injectContext(quest: LayeredQuest, contextTags: string[]): LayeredQuest {
    const relevantContext = this.getRelatedContext(contextTags)
    const enrichedQuest = { ...quest }

    for (const rule of this.injectionRules) {
      const applicableContext = relevantContext.filter((ctx) => rule.sourceTypes.includes(ctx.type))

      if (applicableContext.length > 0) {
        enrichedQuest.layers = this.applyInjectionRule(enrichedQuest.layers, rule, applicableContext)
      }
    }

    return enrichedQuest
  }

  private applyInjectionRule(
    layers: LayeredQuest["layers"],
    _rule: ContextInjectionRule,
    _context: ContextSource[],
  ): LayeredQuest["layers"] {
    // Implementation would merge context into appropriate layer
    // This is a simplified version
    return layers
  }

  buildContextPrompt(tags: string[]): string {
    const context = this.getRelatedContext(tags)
    let prompt = "Relevant Context:\n\n"

    for (const ctx of context) {
      prompt += `${ctx.type.toUpperCase()}: ${ctx.name}\n`
      prompt += `${JSON.stringify(ctx.data, null, 2)}\n\n`
    }

    return prompt
  }
}

export const globalContextEngine = new ContextEngine()
