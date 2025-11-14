# AI Game-Playing Agents System

## Overview

This system provides autonomous AI agents that can play games using Claude Sonnet 4.5 with real-time streaming decision-making. Unlike NPCs (which are game characters with static voice generation), these agents are **players** that autonomously explore, make decisions, and take actions in game worlds.

## Architecture

```
┌─────────────────────────────────────────────┐
│           Agent Dashboard UI                 │
│  • Agent creation & configuration            │
│  • Real-time gameplay monitoring             │
│  • Streaming decision visualization          │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│        Game Agent Engine                     │
│  • Observation → Reasoning → Action loop     │
│  • Claude Sonnet 4.5 with streaming          │
│  • Tool calling for game actions             │
│  • Reward-based learning                     │
└──────────────┬──────────────────────────────┘
               │
      ┌────────┴────────┬────────────────┐
      ▼                 ▼                ▼
┌──────────┐  ┌─────────────────┐  ┌──────────┐
│ Claude   │  │ Game Action     │  │ Session  │
│ Sonnet   │  │ Tools (8)       │  │ State    │
│ 4.5      │  │ • move          │  │ Storage  │
└──────────┘  │ • interact      │  └──────────┘
              │ • attack        │
              │ • speak         │
              │ • use_item      │
              │ • quest_action  │
              │ • inventory     │
              │ • wait          │
              └─────────────────┘
```

## Key Differences: NPCs vs Agents

| Feature | NPCs | Game-Playing Agents |
|---------|------|-------------------|
| **Purpose** | Game characters | Game players |
| **Voice** | Static voice generation | Conversational streaming |
| **AI Decision Making** | No | Yes (Claude Sonnet 4.5) |
| **Tool Calling** | No | Yes (8 action tools) |
| **Autonomy** | Scripted | Fully autonomous |
| **Learning** | No | Reward-based optimization |
| **Streaming** | No | Real-time decision streaming |

## Components

### 1. Agent Types & Configuration

**Location**: `lib/agents/types.ts`

**Key Types**:
- `GameState`: Complete game state observation
- `GameAction`: Actions agents can take
- `AgentPersonality`: Personality configuration
- `AgentConfig`: Full agent configuration
- `AgentSession`: Running session state

**Agent Personalities**:
- **Name**: Unique identifier
- **Traits**: Character traits (e.g., "Curious", "Strategic")
- **Play Style**:
  - `aggressive` - Attack first, ask questions later
  - `cautious` - Careful, methodical approach
  - `exploratory` - Discover everything
  - `efficient` - Optimize actions
  - `social` - Focus on NPC interactions
  - `completionist` - 100% completion goals

**Preference Sliders** (0-1):
- **Risk Tolerance**: Willingness to take risks
- **Exploration vs Exploitation**: Balance between exploring new areas vs optimizing known strategies
- **Social Interaction**: Preference for NPC dialogue
- **Completionism**: Drive to complete all objectives

### 2. Game Action Tools

**Location**: `lib/agents/tools.ts`

**Available Tools**:

1. **Move** - Navigate the game world
   ```typescript
   { direction: 'north' | 'south' | 'east' | 'west' | 'up' | 'down', distance?: number }
   ```

2. **Interact** - Interact with entities
   ```typescript
   { entityId: string, action?: 'talk' | 'pickup' | 'use' | 'examine' }
   ```

3. **Attack** - Combat actions
   ```typescript
   { targetId: string, attackType?: 'melee' | 'ranged' | 'magic', weaponId?: string }
   ```

4. **Use Item** - Use inventory items
   ```typescript
   { itemId: string, targetId?: string }
   ```

5. **Speak** - Dialogue with NPCs
   ```typescript
   { npcId: string, message: string }
   ```

6. **Quest Action** - Quest management
   ```typescript
   { questId: string, action: 'accept' | 'check_progress' | 'complete' | 'abandon' }
   ```

7. **Inventory Action** - Manage inventory
   ```typescript
   { action: 'pickup' | 'drop' | 'equip' | 'unequip' | 'inspect', itemId?: string }
   ```

8. **Wait** - Observe without action
   ```typescript
   { duration?: number, reason?: string }
   ```

### 3. Agent Engine

**Location**: `lib/agents/agent-engine.ts`

**Core Class**: `GameAgentEngine`

**Key Methods**:

```typescript
// Initialize a new game session
async initializeSession(initialGameState: GameState): Promise<AgentSession>

// Make a single decision (streaming)
async *decideActionStreaming(gameState: GameState): AsyncGenerator<AgentStreamChunk>

// Make a single decision (non-streaming)
async decideAction(gameState: GameState): Promise<AgentDecision>

// Run autonomous gameplay loop
async *runAutonomousLoop(maxSteps: number): AsyncGenerator<AgentStreamChunk>

// Session control
pauseSession(): void
resumeSession(): void
endSession(status: 'completed' | 'failed'): void

// Get statistics
getStatistics(): SessionStatistics
```

**Decision-Making Process**:
1. **Observe**: Analyze current game state
2. **Context Building**: Create rich context for LLM
3. **Reasoning**: Claude generates thought process
4. **Tool Selection**: Choose appropriate action tool
5. **Execution**: Execute tool and get result
6. **Reward**: Calculate reward/penalty
7. **Update**: Update game state and history

### 4. API Routes

#### `/api/agents/create` - Create Agent

**POST** - Create a new agent configuration

**Input**:
```json
{
  "name": "Explorer",
  "playStyle": "exploratory",
  "traits": ["Curious", "Strategic"],
  "goals": {
    "primaryGoal": "Discover all locations",
    "secondaryGoals": ["Collect items", "Level up"]
  },
  "riskTolerance": 0.6,
  "explorationVsExploitation": 0.7,
  "model": "claude-sonnet-4-5-20250929",
  "temperature": 0.7
}
```

**Output**:
```json
{
  "success": true,
  "agent": { /* AgentConfig */ }
}
```

#### `/api/agents/session` - Manage Sessions

**POST** - Initialize new session
```json
{
  "agentConfig": { /* AgentConfig */ },
  "gameState": { /* Initial GameState */ }
}
```

**GET** - Get session status
```
?sessionId=session_123_abc
```

**PATCH** - Control session
```json
{
  "sessionId": "session_123_abc",
  "action": "pause" | "resume" | "end"
}
```

#### `/api/agents/action` - Single Action

**POST** - Request agent to make one decision
```json
{
  "sessionId": "session_123_abc",
  "gameState": { /* Optional updated state */ }
}
```

#### `/api/agents/stream` - Streaming Gameplay

**POST** - Stream agent decision-making
```json
{
  "sessionId": "session_123_abc",
  "mode": "single" | "autonomous",
  "gameState": { /* Optional updated state */ }
}
```

**Response**: Server-Sent Events (SSE) stream
```
data: {"type":"thought","content":"I see a merchant nearby...","timestamp":"..."}
data: {"type":"tool_call","content":"Executing: speak","data":{...}}
data: {"type":"tool_result","content":"Spoke with merchant","data":{...}}
```

### 5. Agent Dashboard

**Location**: `app/agents/page.tsx`

**Features**:

**Tab 1: Create Agent**
- Agent name input
- Play style selector
- Personality sliders:
  - Risk Tolerance
  - Exploration Level
  - Social Interaction
  - Completionism
- Primary/secondary goals
- Create & initialize button

**Tab 2: Play Game**
- Control panel:
  - Take Single Action
  - Start Autonomous Play
  - Pause/Resume
  - Stop Session
- Real-time streaming display:
  - Agent thoughts (purple)
  - Tool calls (blue)
  - Tool results (green)
  - Errors (red)
- Auto-scrolling log

**Tab 3: Monitor & Stats**
- Statistics dashboard:
  - Total actions taken
  - Total reward accumulated
  - Success rate
  - Actions per minute
  - Session duration
- Refresh button

## Usage Guide

### 1. Create an Agent

```typescript
// Navigate to /agents
// Fill in agent configuration:
const agentConfig = {
  name: "Brave Explorer",
  playStyle: "exploratory",
  traits: ["Brave", "Curious", "Strategic"],
  riskTolerance: 0.7,        // High risk tolerance
  exploration: 0.8,           // Heavy exploration
  social: 0.5,               // Moderate social
  completionism: 0.9,        // High completionism
}

// Click "Create & Initialize Agent"
```

### 2. Start Gameplay

**Single Action Mode**:
- Agent makes one decision
- Waits for next command
- Good for step-by-step observation

**Autonomous Mode**:
- Agent plays continuously
- Makes decisions based on game state
- Runs until stopped or max actions reached

### 3. Monitor Progress

Watch real-time streaming:
```
[thought] I see a treasure chest nearby. It's 10 units away.
[thought] My primary goal is exploration, so I should investigate.
[tool_call] Executing: move
[tool_result] Moved north by 5 units to position (0, 5, 0)
[tool_call] Executing: interact
[tool_result] Interacted with treasure_chest, obtained 50 gold!
```

### 4. Integrate with Your Game

```typescript
import { GameAgentEngine } from '@/lib/agents/agent-engine'

// Create engine
const engine = new GameAgentEngine(agentConfig)

// Initialize session
await engine.initializeSession(gameState)

// Game loop
while (gameRunning) {
  // Get game state from your game engine
  const gameState = getGameState()

  // Update agent
  engine.updateGameState(gameState)

  // Get agent decision
  const decision = await engine.decideAction(gameState)

  // Apply action in your game
  applyAction(decision.action)

  // Get result
  const result = getActionResult()

  // Continue loop
}
```

## Example Scenarios

### Scenario 1: Dungeon Exploration

```typescript
const gameState = {
  environment: "Dark Dungeon",
  position: { x: 0, y: 0, z: 0 },
  visibleEntities: [
    { id: "door_locked", type: "door", position: { x: 5, y: 0 } },
    { id: "skeleton_1", type: "enemy", position: { x: -3, y: 2 } },
    { id: "torch_wall", type: "item", position: { x: 2, y: 0 } }
  ],
  inventory: [
    { id: "key_old", name: "Old Key", quantity: 1 }
  ],
  stats: { health: 80, mana: 30 },
  activeQuests: [
    {
      id: "escape_dungeon",
      title: "Escape the Dungeon",
      objectives: [
        { description: "Find the exit", completed: false }
      ]
    }
  ],
  availableActions: ["move", "interact", "attack", "use_item"]
}

// Agent might decide:
// 1. Move towards the door
// 2. Use the key on the locked door
// 3. Avoid or fight the skeleton based on risk tolerance
```

### Scenario 2: Social Interaction

```typescript
const gameState = {
  environment: "Village Square",
  visibleEntities: [
    {
      id: "npc_elder",
      type: "villager",
      properties: { name: "Village Elder", friendly: true }
    }
  ],
  dialogueContext: {
    npcName: "Village Elder",
    npcId: "npc_elder",
    conversationHistory: [
      { speaker: "npc", message: "Welcome, traveler. The village needs your help." }
    ]
  }
}

// Social agent might decide:
// 1. Speak with elder to learn about quest
// 2. Ask specific questions
// 3. Accept quest
```

### Scenario 3: Combat Strategy

```typescript
const gameState = {
  environment: "Battlefield",
  visibleEntities: [
    { id: "enemy_1", type: "orc", properties: { health: 60, distance: 5 } },
    { id: "enemy_2", type: "orc", properties: { health: 40, distance: 8 } },
    { id: "cover_rock", type: "cover", position: { x: 3, y: 0 } }
  ],
  inventory: [
    { id: "potion_health", name: "Health Potion", quantity: 2 },
    { id: "sword", name: "Steel Sword", quantity: 1 }
  ],
  stats: { health: 45, mana: 30 }
}

// Aggressive agent might: Attack nearest enemy
// Cautious agent might: Move to cover, use potion, then attack weaker enemy
```

## Best Practices

### Agent Design

1. **Clear Goals**: Define specific, achievable goals
2. **Balanced Preferences**: Avoid extreme values unless intentional
3. **Appropriate Play Style**: Match style to game type
4. **Descriptive Names**: Names help debug agent behavior

### Integration

1. **Rich Game State**: Provide comprehensive state information
2. **Frequent Updates**: Update state after each action
3. **Reward Design**: Clear rewards help agent learn
4. **Action Validation**: Validate actions are possible before execution

### Performance

1. **Rate Limiting**: Respect AI SDK rate limits
2. **Session Management**: Clean up old sessions
3. **Error Handling**: Handle tool execution failures gracefully
4. **Streaming**: Use streaming for better UX

### Testing

1. **Start Simple**: Test with simple game states first
2. **Monitor Decisions**: Watch agent reasoning
3. **Adjust Personality**: Tune based on behavior
4. **Different Scenarios**: Test various game situations

## Troubleshooting

### Agent Not Making Good Decisions

- Check game state completeness
- Review system prompt
- Adjust temperature (lower = more deterministic)
- Verify tool descriptions are clear

### Streaming Not Working

- Check API route is using SSE format
- Verify client is handling streams correctly
- Check for CORS issues
- Ensure session exists

### Actions Failing

- Validate game state before actions
- Check tool parameter types
- Verify entities exist in state
- Review action validation logic

### Performance Issues

- Reduce maxTokens if responses too long
- Use non-streaming for batch processing
- Implement caching for game state
- Optimize tool execution

## Advanced Features

### Custom Tools

Add your own game-specific tools:

```typescript
import { AgentTool } from '@/lib/agents/types'

const craftItemTool: AgentTool = {
  name: 'craft_item',
  description: 'Craft an item using materials',
  parameters: z.object({
    recipeId: z.string(),
    quantity: z.number().default(1),
  }),
  execute: async (parameters, gameState) => {
    // Your crafting logic
    return {
      success: true,
      action: { type: 'craft_item', parameters },
      newState: updatedGameState,
      reward: 2.0,
      description: 'Crafted sword',
    }
  },
}

// Add to gameActionTools array
```

### Multi-Agent Systems

Run multiple agents simultaneously:

```typescript
const agents = [
  new GameAgentEngine(explorerConfig),
  new GameAgentEngine(combatConfig),
  new GameAgentEngine(socialConfig),
]

// Each agent observes same world, takes different actions
for (const agent of agents) {
  await agent.initializeSession(gameState)
  const decision = await agent.decideAction(gameState)
  // Process each agent's decision
}
```

### Learning & Adaptation

Track agent performance over time:

```typescript
const stats = engine.getStatistics()

// Analyze performance
if (stats.successRate < 0.5) {
  // Agent struggling, adjust difficulty or provide hints
}

if (stats.averageReward < 0) {
  // Agent making poor choices, review reward structure
}

// Use history for learning
const recentActions = session.actionHistory.slice(-10)
// Analyze patterns, adjust strategy
```

## Future Enhancements

- [ ] Multi-step planning with search trees
- [ ] Memory system for long-term learning
- [ ] Agent communication protocols
- [ ] Visual observation (image input)
- [ ] Reinforcement learning integration
- [ ] Agent performance leaderboards
- [ ] Replay system for analysis
- [ ] Custom reward functions
- [ ] Agent marketplace

## Resources

- **AI SDK Documentation**: https://ai-sdk.dev/docs
- **Claude Sonnet 4.5**: https://www.anthropic.com/news/claude-sonnet-4-5
- **Tool Calling Guide**: https://ai-sdk.dev/providers/ai-sdk-providers/anthropic
- **Streaming SSE**: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events

## Support

For issues or questions:
1. Check session status at `/api/agents/session`
2. Review agent configuration
3. Check browser console for errors
4. Review streaming output for error messages
5. Verify game state format matches types

---

**Version**: 1.0.0
**Last Updated**: 2025-11-13
**Maintainer**: Pipeline Development Team
