import { XMLBuilder } from 'fast-xml-parser'
import type { Evaluator, EvaluationResult, XMLEvent } from './event-types'

/**
 * Evaluators extract insights from event sequences (inspired by ElizaOS)
 * They run after actions to analyze what happened and extract learnings
 */

const xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
  format: true,
  suppressEmptyNode: true,
})

/**
 * Success Pattern Evaluator - identifies successful action patterns
 */
export class SuccessPatternEvaluator implements Evaluator {
  name = 'successPattern'
  description = 'Identifies patterns in successful actions'

  async evaluate(events: XMLEvent[], sessionId: string): Promise<EvaluationResult> {
    // Find action events with positive rewards
    const actions = events.filter((e) => e.type === 'action' && (e.data.result as any)?.reward > 0)

    // Group by action type
    const patterns = new Map<string, { count: number; totalReward: number }>()
    for (const action of actions) {
      const actionType = action.data.actionType as string
      const reward = (action.data.result as any)?.reward || 0

      if (!patterns.has(actionType)) {
        patterns.set(actionType, { count: 0, totalReward: 0 })
      }

      const pattern = patterns.get(actionType)!
      pattern.count++
      pattern.totalReward += reward
    }

    // Convert to facts
    const facts = Array.from(patterns.entries()).map(([actionType, data]) => ({
      type: 'success_pattern',
      content: `Action '${actionType}' succeeded ${data.count} times with average reward ${(data.totalReward / data.count).toFixed(2)}`,
      confidence: Math.min(data.count / 10, 1.0), // Higher confidence with more occurrences
    }))

    const insights = xmlBuilder.build({
      evaluation: {
        '@_evaluator': this.name,
        '@_timestamp': new Date().toISOString(),
        patterns: {
          pattern: Array.from(patterns.entries()).map(([actionType, data]) => ({
            '@_action': actionType,
            '@_occurrences': data.count,
            '@_avgReward': (data.totalReward / data.count).toFixed(2),
            '@_significance': Math.min(data.count / 10, 1.0),
          })),
        },
      },
    })

    return {
      evaluatorName: this.name,
      insights,
      facts,
      patterns: Array.from(patterns.entries()).map(([actionType, data]) => ({
        pattern: actionType,
        occurrences: data.count,
        significance: Math.min(data.count / 10, 1.0),
      })),
    }
  }
}

/**
 * Mistake Learning Evaluator - learns from failures
 */
export class MistakeLearningEvaluator implements Evaluator {
  name = 'mistakeLearning'
  description = 'Learns from failed actions and mistakes'

  async evaluate(events: XMLEvent[], sessionId: string): Promise<EvaluationResult> {
    // Find failed actions
    const failures = events.filter((e) => e.type === 'action' && !(e.data.result as any)?.success)

    const lessons = failures.map((failure, idx) => ({
      type: 'lesson',
      content: `Avoid action '${failure.data.actionType}' with parameters ${JSON.stringify(failure.data.parameters)} - resulted in: ${(failure.data.result as any)?.description}`,
      confidence: 0.8,
    }))

    const insights = xmlBuilder.build({
      evaluation: {
        '@_evaluator': this.name,
        '@_timestamp': new Date().toISOString(),
        '@_failureCount': failures.length,
        lessons: {
          lesson: failures.map((failure) => ({
            '@_action': failure.data.actionType,
            description: (failure.data.result as any)?.description || 'Unknown failure',
          })),
        },
      },
    })

    return {
      evaluatorName: this.name,
      insights,
      facts: lessons,
      recommendations: lessons.length > 0
        ? [`Review failed actions: ${lessons.map(l => l.content.split(' - ')[0]).join(', ')}`]
        : [],
    }
  }
}

/**
 * Goal Progress Evaluator - tracks progress toward goals
 */
export class GoalProgressEvaluator implements Evaluator {
  name = 'goalProgress'
  description = 'Evaluates progress toward stated goals'

  async evaluate(events: XMLEvent[], sessionId: string): Promise<EvaluationResult> {
    // Look for quest completion, exploration, rewards
    const questEvents = events.filter((e) =>
      e.type === 'action' &&
      (e.data.actionType === 'quest_action' || e.data.actionType === 'interact')
    )

    const totalReward = events
      .filter((e) => e.type === 'reward')
      .reduce((sum, e) => sum + ((e.data.reward as number) || 0), 0)

    const facts = [
      {
        type: 'goal_progress',
        content: `Made ${questEvents.length} quest-related actions with total reward ${totalReward.toFixed(2)}`,
        confidence: 0.9,
      },
    ]

    const insights = xmlBuilder.build({
      evaluation: {
        '@_evaluator': this.name,
        '@_timestamp': new Date().toISOString(),
        progress: {
          questActions: questEvents.length,
          totalReward: totalReward.toFixed(2),
          momentum: questEvents.length > 0 ? 'positive' : 'neutral',
        },
      },
    })

    return {
      evaluatorName: this.name,
      insights,
      facts,
      recommendations: totalReward < 0
        ? ['Consider changing strategy - current approach is yielding negative rewards']
        : [],
    }
  }
}

/**
 * Relationship Evaluator - tracks NPC relationships
 */
export class RelationshipEvaluator implements Evaluator {
  name = 'relationships'
  description = 'Tracks and evaluates NPC relationships'

  async evaluate(events: XMLEvent[], sessionId: string): Promise<EvaluationResult> {
    // Find speak/interact actions
    const socialActions = events.filter((e) =>
      e.type === 'action' &&
      (e.data.actionType === 'speak' || e.data.actionType === 'interact')
    )

    // Track who we interacted with
    const npcInteractions = new Map<string, number>()
    for (const action of socialActions) {
      const npcId = (action.data.parameters as any)?.npcId || (action.data.parameters as any)?.entityId
      if (npcId) {
        npcInteractions.set(npcId, (npcInteractions.get(npcId) || 0) + 1)
      }
    }

    const facts = Array.from(npcInteractions.entries()).map(([npcId, count]) => ({
      type: 'relationship',
      content: `Interacted with NPC ${npcId} ${count} times - ${count > 5 ? 'strong' : count > 2 ? 'developing' : 'initial'} relationship`,
      confidence: Math.min(count / 10, 1.0),
    }))

    const insights = xmlBuilder.build({
      evaluation: {
        '@_evaluator': this.name,
        '@_timestamp': new Date().toISOString(),
        relationships: {
          npc: Array.from(npcInteractions.entries()).map(([npcId, count]) => ({
            '@_id': npcId,
            '@_interactions': count,
            '@_strength': count > 5 ? 'strong' : count > 2 ? 'developing' : 'initial',
          })),
        },
      },
    })

    return {
      evaluatorName: this.name,
      insights,
      facts,
    }
  }
}

/**
 * Efficiency Evaluator - evaluates action efficiency
 */
export class EfficiencyEvaluator implements Evaluator {
  name = 'efficiency'
  description = 'Evaluates agent action efficiency and resource usage'

  async evaluate(events: XMLEvent[], sessionId: string): Promise<EvaluationResult> {
    const actions = events.filter((e) => e.type === 'action')
    const rewards = events.filter((e) => e.type === 'reward')

    const totalReward = rewards.reduce((sum, e) => sum + ((e.data.reward as number) || 0), 0)
    const rewardPerAction = actions.length > 0 ? totalReward / actions.length : 0

    const insights = xmlBuilder.build({
      evaluation: {
        '@_evaluator': this.name,
        '@_timestamp': new Date().toISOString(),
        efficiency: {
          totalActions: actions.length,
          totalReward: totalReward.toFixed(2),
          rewardPerAction: rewardPerAction.toFixed(2),
          rating: rewardPerAction > 2 ? 'excellent' : rewardPerAction > 1 ? 'good' : rewardPerAction > 0 ? 'fair' : 'poor',
        },
      },
    })

    const facts = [
      {
        type: 'efficiency',
        content: `Current efficiency: ${rewardPerAction.toFixed(2)} reward per action (${actions.length} actions, ${totalReward.toFixed(2)} total reward)`,
        confidence: Math.min(actions.length / 20, 1.0),
      },
    ]

    const recommendations = []
    if (rewardPerAction < 1) {
      recommendations.push('Efficiency is low - consider more selective actions')
    } else if (rewardPerAction > 2) {
      recommendations.push('High efficiency - current strategy is working well')
    }

    return {
      evaluatorName: this.name,
      insights,
      facts,
      recommendations,
    }
  }
}

/**
 * Evaluator Registry - manages all evaluators
 */
export class EvaluatorRegistry {
  private evaluators: Map<string, Evaluator> = new Map()

  register(evaluator: Evaluator): void {
    this.evaluators.set(evaluator.name, evaluator)
  }

  get(name: string): Evaluator | undefined {
    return this.evaluators.get(name)
  }

  async evaluateAll(events: XMLEvent[], sessionId: string): Promise<EvaluationResult[]> {
    const results: EvaluationResult[] = []

    for (const evaluator of this.evaluators.values()) {
      try {
        const result = await evaluator.evaluate(events, sessionId)
        results.push(result)
      } catch (error) {
        console.error(`Evaluator ${evaluator.name} failed:`, error)
      }
    }

    return results
  }

  getAll(): Evaluator[] {
    return Array.from(this.evaluators.values())
  }
}

/**
 * Create default evaluator registry with all standard evaluators
 */
export function createDefaultEvaluators(): EvaluatorRegistry {
  const registry = new EvaluatorRegistry()

  registry.register(new SuccessPatternEvaluator())
  registry.register(new MistakeLearningEvaluator())
  registry.register(new GoalProgressEvaluator())
  registry.register(new RelationshipEvaluator())
  registry.register(new EfficiencyEvaluator())

  return registry
}
