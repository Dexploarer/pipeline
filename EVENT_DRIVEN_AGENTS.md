# Event-Driven AI Agents (ElizaOS-Inspired)

## Overview

This is a complete redesign of the AI agent system using an **event-driven architecture** inspired by ElizaOS. Agents now use:
- **XML event logging** for all interactions
- **Providers** for context injection
- **Evaluators** for learning from experiences
- **Template-based prompts** compiled from XML logs
- **Memory system** for knowledge retention

## Architecture Comparison

### Old Design (Direct Tool Calling)
```
GameState → LLM → Tools → Result
```

### New Design (Event-Driven + XML)
```
GameState Event (XML)
      ↓
Event Logger (XML formatted)
      ↓
Providers (gather context as XML)
      ↓
Template Compiler (assemble XML logs into prompt)
      ↓
LLM Decision (with streaming)
      ↓
Actions (via tools)
      ↓
Evaluators (extract insights from XML logs)
      ↓
Memory Storage (XML formatted facts)
```

## Key Components

### 1. XML Event Logger (`lib/agents/event-logger.ts`)

Logs all agent interactions in XML format:

**Event Types**:
- `game_state` - Current game state
- `action` - Actions taken by agent
- `thought` - Agent reasoning
- `observation` - Things agent notices
- `reward` - Rewards received
- `error` - Errors encountered
- `message` - Messages/dialogue

**Example XML Log**:
```xml
<event type="action" timestamp="2025-11-13T10:30:00Z">
  <action type="move">
    <parameters>
      <direction>north</direction>
      <distance>5</distance>
    </parameters>
    <result success="true" reward="0.1">
      <description>Moved north by 5 units to position (0, 5, 0)</description>
    </result>
  </action>
</event>
```

**Methods**:
- `logGameState()` - Log current game state
- `logAction()` - Log agent action
- `logThought()` - Log agent reasoning
- `logObservation()` - Log observations
- `logReward()` - Log reward received
- `logError()` - Log errors
- `getLogsAsXMLBatch()` - Get logs as XML batch

### 2. Providers (`lib/agents/providers.ts`)

Supply context to the agent (inspired by ElizaOS providers):

**Available Providers**:

1. **GameStateProvider** - Current game state (position, entities, inventory)
   ```xml
   <context type="gameState">
     <environment>Forest Clearing</environment>
     <position x="0" y="5" z="0"/>
     <stats>
       <health>100</health>
       <mana>50</mana>
     </stats>
   </context>
   ```

2. **MemoryProvider** - Relevant memories from past experiences
   ```xml
   <context type="memory" count="5">
     <memories>
       <memory id="0" type="success_pattern" confidence="0.8">
         Action 'move' succeeded 10 times with average reward 0.15
       </memory>
     </memories>
   </context>
   ```

3. **GoalProvider** - Current goals and objectives
   ```xml
   <context type="goals">
     <primaryGoal>Discover all locations and complete quests</primaryGoal>
     <secondaryGoals>
       <goal priority="2">Collect rare items</goal>
       <goal priority="1">Level up efficiently</goal>
     </secondaryGoals>
   </context>
   ```

4. **PerformanceProvider** - Agent performance statistics
   ```xml
   <context type="performance">
     <metrics>
       <totalReward>127.5</totalReward>
       <actionCount>85</actionCount>
       <successRate>94.1%</successRate>
       <averageReward>1.50</averageReward>
     </metrics>
   </context>
   ```

5. **RecentEventsProvider** - Recent game events
   ```xml
   <context type="recentEvents" count="10">
     <events>
       <event type="combat" timestamp="...">
         Defeated goblin scout, gained 50 XP
       </event>
     </events>
   </context>
   ```

**Provider Interface**:
```typescript
interface Provider {
  name: string
  description: string
  get(sessionId: string): Promise<ProviderContext>
}
```

### 3. Evaluators (`lib/agents/evaluators.ts`)

Extract insights from event sequences (inspired by ElizaOS evaluators):

**Available Evaluators**:

1. **SuccessPatternEvaluator** - Identifies successful action patterns
   - Tracks which actions yield positive rewards
   - Calculates average reward per action type
   - Confidence increases with more occurrences

2. **MistakeLearningEvaluator** - Learns from failures
   - Identifies failed actions
   - Stores lessons to avoid repeating mistakes
   - Creates recommendations for improvement

3. **GoalProgressEvaluator** - Tracks progress toward goals
   - Monitors quest-related actions
   - Calculates total rewards
   - Evaluates momentum (positive/negative)

4. **RelationshipEvaluator** - Tracks NPC relationships
   - Counts interactions with each NPC
   - Classifies relationship strength
   - Stores relationship facts in memory

5. **EfficiencyEvaluator** - Evaluates action efficiency
   - Calculates reward per action
   - Rates efficiency (excellent/good/fair/poor)
   - Provides optimization recommendations

**Evaluator Interface**:
```typescript
interface Evaluator {
  name: string
  description: string
  evaluate(events: XMLEvent[], sessionId: string): Promise<EvaluationResult>
}
```

**Evaluation Results**:
```xml
<evaluation evaluator="successPattern" timestamp="...">
  <patterns>
    <pattern action="interact" occurrences="15" avgReward="1.20" significance="0.9"/>
    <pattern action="move" occurrences="32" avgReward="0.15" significance="1.0"/>
  </patterns>
</evaluation>
```

### 4. Prompt Templates (`lib/agents/prompt-templates.ts`)

Compile XML logs into structured prompts for the LLM:

**Available Templates**:

1. **decision** - General decision-making
2. **exploration** - Exploration and discovery
3. **combat** - Combat situations
4. **social** - NPC interactions
5. **learning** - Post-action evaluation
6. **goalPlanning** - Goal setting and planning

**Template Structure**:
```typescript
interface PromptTemplate {
  name: string
  description: string
  template: string // Template with {{placeholders}}
  requiredEvents: string[] // Event types to include
  providers?: string[] // Providers to use
  includeMemory: boolean
}
```

**Compilation Process**:
1. Select template based on game state
2. Gather provider contexts (XML)
3. Filter relevant events from log (XML)
4. Get relevant memories (XML)
5. Replace placeholders in template
6. Generate system + user prompt

**Example Compiled Prompt**:
```
You are an AI agent playing a game...

## Current Context
<contexts>
  <!-- Context from gameState -->
  <context type="gameState">
    <environment>Forest Clearing</environment>
    ...
  </context>

  <!-- Context from goals -->
  <context type="goals">
    <primaryGoal>Explore the forest</primaryGoal>
    ...
  </context>
</contexts>

## Recent Events (XML Log)
<eventLog count="5">
  <event type="action" timestamp="...">
    ...
  </event>
</eventLog>

## Your Memory
<memory count="10">
  <memory type="success_pattern" confidence="0.8">
    Action 'move' succeeded 10 times...
  </memory>
</memory>

## Instructions
Based on the above XML information, decide on the best action...
```

### 5. Event-Driven Agent Engine (`lib/agents/event-driven-engine.ts`)

Core engine that ties everything together:

**Decision Cycle**:
```typescript
1. Event occurs (game state change)
2. Log event as XML
3. Gather provider contexts (all in XML)
4. Select appropriate template
5. Get relevant memories (XML)
6. Compile prompt from template + logs + contexts + memories
7. Stream LLM decision-making
8. Execute tools
9. Log results (XML)
10. Run evaluators on recent events
11. Store learnings in memory (XML)
12. Update providers
```

**Key Methods**:
- `initializeSession()` - Start event-driven session
- `processGameStateEvent()` - Handle game state update
- `decideWithStreaming()` - Make decision with streaming
- `runAutonomousLoop()` - Autonomous gameplay
- `getEventLogsXML()` - Export logs as XML

**Streaming Output**:
```
📋 Gathering context from providers...
📝 Using template: decision
🔨 Compiling prompt from XML logs and context...
✅ Compiled prompt with 20 events, 5 contexts, 10 memories
🤔 Agent reasoning...
[Thinking: I see a treasure chest nearby...]
🔧 Executing: move
✅ Moved north by 5 units
🔧 Executing: interact
✅ Interacted with treasure chest, obtained 50 gold!
📊 Evaluating performance and extracting learnings...
✅ Decision cycle complete
```

## API Routes

### `/api/agents-v2/session`

**POST** - Initialize event-driven session
```json
{
  "agentConfig": { /* AgentConfig */ },
  "gameState": { /* GameState */ }
}
```

Response:
```json
{
  "success": true,
  "sessionId": "session_123",
  "architecture": "event-driven",
  "features": [
    "XML event logging",
    "Provider context injection",
    "Evaluator learning",
    "Template-based prompts",
    "Memory system"
  ]
}
```

**GET** - Get session status
```
?sessionId=session_123
```

Response:
```json
{
  "success": true,
  "sessionId": "session_123",
  "status": "idle",
  "eventLogSize": 47,
  "memorySize": 15,
  "architecture": "event-driven-xml"
}
```

**PATCH** - Control session
```json
{
  "sessionId": "session_123",
  "action": "pause" | "resume" | "end"
}
```

### `/api/agents-v2/stream`

**POST** - Stream agent decision-making
```json
{
  "sessionId": "session_123",
  "gameState": { /* Optional updated state */ },
  "mode": "single" | "autonomous"
}
```

Returns Server-Sent Events stream:
```
data: {"type":"thought","content":"📋 Gathering context..."}
data: {"type":"thought","content":"📝 Using template: decision"}
data: {"type":"tool_call","content":"🔧 Executing: move"}
data: {"type":"tool_result","content":"Moved north..."}
data: {"type":"xml_logs","data":{"xml":"<eventBatch>...</eventBatch>"}}
```

### `/api/agents-v2/logs`

**GET** - Download XML event logs
```
?sessionId=session_123&eventTypes=action,reward&limit=100
```

Returns XML file:
```xml
<eventBatch sessionId="session_123" count="47">
  <events>
    <event type="action" timestamp="..." level="info">
      ...
    </event>
  </events>
</eventBatch>
```

## Usage Examples

### Create Event-Driven Agent

```typescript
import { EventDrivenAgentEngine } from '@/lib/agents/event-driven-engine'

// Create agent
const engine = new EventDrivenAgentEngine(agentConfig)

// Initialize session
const sessionId = await engine.initializeSession(gameState)

// Process game state updates (events)
await engine.processGameStateEvent(updatedGameState)

// Make decision with streaming
for await (const chunk of engine.decideWithStreaming()) {
  console.log(`[${chunk.type}] ${chunk.content}`)
}

// Get XML logs
const xmlLogs = engine.getEventLogsXML()
console.log(xmlLogs) // Full XML event log
```

### Custom Provider

```typescript
import { Provider, ProviderContext } from '@/lib/agents/event-types'

class WeatherProvider implements Provider {
  name = 'weather'
  description = 'Provides current weather conditions'

  async get(sessionId: string): Promise<ProviderContext> {
    const weather = getCurrentWeather()

    const xml = `<context type="weather">
      <condition>${weather.condition}</condition>
      <temperature>${weather.temp}</temperature>
    </context>`

    return {
      providerName: this.name,
      xml,
      priority: 6,
    }
  }
}

// Register provider
engine.providers.register(new WeatherProvider())
```

### Custom Evaluator

```typescript
import { Evaluator, EvaluationResult } from '@/lib/agents/event-types'

class CombatEfficiencyEvaluator implements Evaluator {
  name = 'combatEfficiency'
  description = 'Evaluates combat performance'

  async evaluate(events: XMLEvent[], sessionId: string): Promise<EvaluationResult> {
    const combatEvents = events.filter(e =>
      e.type === 'action' && e.data.actionType === 'attack'
    )

    const insights = `<evaluation>
      <combatActions>${combatEvents.length}</combatActions>
    </evaluation>`

    return {
      evaluatorName: this.name,
      insights,
      facts: [
        {
          type: 'combat_stats',
          content: `Engaged in ${combatEvents.length} combat actions`,
          confidence: 0.9,
        }
      ],
    }
  }
}
```

## Benefits of Event-Driven Design

### 1. **Complete Auditability**
- Every interaction logged as XML
- Full event history available
- Easy to debug and analyze
- Export logs for external analysis

### 2. **Modular Architecture**
- Providers plug in for context
- Evaluators plug in for learning
- Templates define prompt structure
- Easy to add new components

### 3. **Learning & Memory**
- Evaluators extract insights automatically
- Facts stored in memory
- Memory influences future decisions
- Continuous improvement

### 4. **Context-Aware Decisions**
- Providers inject relevant context
- Templates ensure structured prompts
- XML format is human & machine readable
- Easy to understand agent reasoning

### 5. **Flexibility**
- Different templates for different scenarios
- Dynamic template selection
- Configurable providers & evaluators
- Extensible architecture

## Comparison: V1 vs V2

| Feature | V1 (Direct) | V2 (Event-Driven) |
|---------|-------------|-------------------|
| **Logging** | Basic text logs | XML structured logs |
| **Context** | Direct game state | Provider system |
| **Learning** | None | Evaluator system |
| **Memory** | Simple history | Structured memory |
| **Prompts** | Static | Template-based |
| **Auditability** | Limited | Complete (XML) |
| **Extensibility** | Low | High (plugins) |
| **Debugging** | Difficult | Easy (XML logs) |
| **Inspiration** | Custom | ElizaOS |

## Advanced Features

### Event Listeners

Register custom event handlers:
```typescript
engine.on('system', async (event, state) => {
  console.log('System event:', event.xml)
}, priority: 10)
```

### XML Log Export

Download complete XML logs:
```typescript
const xml = engine.getEventLogsXML(['action', 'reward'], 100)
// Save to file or analyze externally
```

### Memory Queries

Access agent memories:
```typescript
const state = engine.getState()
const memories = state?.memory.filter(m => m.type === 'success_pattern')
```

### Provider Priority

Control context importance:
```typescript
const context: ProviderContext = {
  providerName: 'criticalInfo',
  xml: '<context>...</context>',
  priority: 10, // Higher priority = included first
}
```

## Future Enhancements

- [ ] Hierarchical Task Networks (HTN) for multi-step planning
- [ ] Multi-agent communication via XML messages
- [ ] Vector search for semantic memory retrieval
- [ ] Time-based context expiration
- [ ] Event replay and debugging tools
- [ ] Visual XML log viewer
- [ ] Machine learning on XML patterns
- [ ] Cross-session knowledge transfer

## Resources

- **ElizaOS Documentation**: https://docs.elizaos.ai
- **XML Best Practices**: Standard XML formatting
- **Fast XML Parser**: https://www.npmjs.com/package/fast-xml-parser
- **AI SDK**: https://ai-sdk.dev

---

**Version**: 2.0.0 (Event-Driven)
**Architecture**: ElizaOS-Inspired
**Last Updated**: 2025-11-13
**Maintainer**: Pipeline Development Team
