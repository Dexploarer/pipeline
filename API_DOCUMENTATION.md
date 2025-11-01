# API Documentation

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## Rate Limiting

Rate limits vary by endpoint:

- **AI Generation:** 5 requests per minute
- **Standard API:** 30 requests per minute
- **Search:** 60 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 29
X-RateLimit-Reset: 1672531200000
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific error message"
    }
  ],
  "requestId": "req_1234567890"
}
```

### Common Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid request parameters |
| 401 | UNAUTHORIZED | Missing or invalid authentication |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 413 | PAYLOAD_TOO_LARGE | Request body exceeds limit |
| 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| 500 | INTERNAL_ERROR | Server error |
| 503 | SERVICE_UNAVAILABLE | Service temporarily unavailable |

---

## NPC Endpoints

### Generate NPC (v2)

Generate a complete NPC with AI in 5 stages: personality, quest, dialogue, relationships, and behavior.

```http
POST /api/generate-npc-v2
```

**Request Body:**

```json
{
  "prompt": "A grumpy blacksmith who lost his apprentice to a dragon attack",
  "archetype": "merchant",
  "model": "gpt-4o-mini",
  "zoneId": "550e8400-e29b-41d4-a716-446655440000",
  "relatedNpcIds": ["660e8400-e29b-41d4-a716-446655440001"],
  "priority": "quality"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| prompt | string | Yes | Description of the NPC (10-2000 chars) |
| archetype | enum | No | One of: merchant, warrior, scholar, rogue, mystic, noble, commoner |
| model | string | No | AI model to use |
| zoneId | uuid | No | Zone where NPC will spawn |
| relatedNpcIds | uuid[] | No | Related NPCs for relationship generation (max 10) |
| priority | enum | No | One of: cost, quality, speed (default: quality) |

**Response:**

```json
{
  "id": "npc_1234567890",
  "version": "2.0.0",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "personality": {
    "name": "Grom Ironforge",
    "archetype": "merchant",
    "traits": ["grumpy", "skilled", "grieving"],
    "goals": ["Avenge apprentice", "Rebuild workshop"],
    "fears": ["Losing more people", "Dragons"],
    "moralAlignment": "Lawful Good"
  },
  "backstory": "Once renowned blacksmith...",
  "dialogueStyle": "Gruff, short sentences",
  "dialogues": [...],
  "quests": [...],
  "behavior": {
    "schedule": [...],
    "reactions": [...],
    "relationships": [...]
  },
  "zoneId": "550e8400-e29b-41d4-a716-446655440000",
  "elizaOSConfig": {...},
  "metadata": {...},
  "cached": false
}
```

**Rate Limit:** 5 requests per minute

---

### Generate Dialogue Tree

Generate branching dialogue for an NPC.

```http
POST /api/generate-dialogue
```

**Request Body:**

```json
{
  "context": "Initial meeting with quest giver",
  "npcId": "550e8400-e29b-41d4-a716-446655440000",
  "maxDepth": 3,
  "branchingFactor": 3
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| context | string | Yes | Context for dialogue generation (10-2000 chars) |
| npcId | uuid | No | NPC ID to generate dialogue for |
| maxDepth | number | No | Maximum dialogue tree depth (1-10, default: 3) |
| branchingFactor | number | No | Number of response options (1-5, default: 3) |

---

### Generate Quest Layer

Generate a specific layer of a 6-layer quest system.

```http
POST /api/generate-quest-layer
```

**Request Body:**

```json
{
  "questTitle": "The Lost Artifact of Eldoria",
  "layerType": "gameflow",
  "existingLayers": {},
  "zoneId": "550e8400-e29b-41d4-a716-446655440000",
  "relatedNpcIds": ["550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002"]
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| questTitle | string | Yes | Title of the quest (1-255 chars) |
| layerType | enum | Yes | One of: gameflow, lore, history, relationships, economy, world-events |
| existingLayers | object | No | Previously generated layers |
| zoneId | uuid | No | Zone where quest takes place |
| relatedNpcIds | uuid[] | No | NPCs involved in quest (max 20) |

**Layer Types:**

- **gameflow:** Objectives, branches, triggers, rewards
- **lore:** Narrative, history, factions, artifacts
- **history:** Timeline, events, historical figures
- **relationships:** NPC/faction/player dynamics
- **economy:** Costs, market impacts, trade routes
- **world-events:** Triggered events, environmental changes

---

### Generate Lore Entry

Generate world-building lore.

```http
POST /api/generate-lore
```

**Request Body:**

```json
{
  "prompt": "The ancient war between dragons and giants",
  "category": "history",
  "existingLore": ["lore_entry_1", "lore_entry_2"],
  "zoneId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| prompt | string | Yes | Description of lore (10-2000 chars) |
| category | enum | Yes | One of: history, culture, geography, magic, religion, politics, economy, legend, bestiary |
| existingLore | string[] | No | Related lore entries for context |
| zoneId | uuid | No | Zone this lore is associated with |

---

### Simulate NPC Interaction

Test NPC behavior in simulated interactions.

```http
POST /api/simulate-interaction
```

**Request Body:**

```json
{
  "npcScript": { ... },
  "playerInput": "Hello, how are you today?",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "context": {
    "questsCompleted": ["550e8400-e29b-41d4-a716-446655440001"],
    "relationship": 50
  }
}
```

---

### Validate Request

Test request validation without processing.

```http
POST /api/validate
```

**Request Body:**

Any request body to validate.

**Response:**

```json
{
  "valid": true,
  "errors": []
}
```

---

## Request Size Limits

- **Standard API requests:** 10MB
- **File upload endpoints:** 50MB

Requests exceeding limits receive a `413 Payload Too Large` error.

---

## Caching

AI-generated responses are cached for 1 hour. Cached responses include:

```json
{
  ...,
  "cached": true
}
```

---

## Best Practices

1. **Use appropriate priorities:**
   - `cost`: Fastest, cheapest models for testing
   - `quality`: Best models for production content
   - `speed`: Balanced models for quick iteration

2. **Provide context:**
   - Include `zoneId` for location-aware generation
   - Include `relatedNpcIds` for relationship generation
   - Include `existingLayers` when generating subsequent quest layers

3. **Handle rate limits:**
   - Implement exponential backoff
   - Cache responses client-side
   - Batch requests when possible

4. **Error handling:**
   - Always check response status codes
   - Parse error messages for user feedback
   - Implement retry logic for 5xx errors

---

## Examples

### Complete NPC Generation Flow

```typescript
// 1. Generate NPC
const npcResponse = await fetch('/api/generate-npc-v2', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    prompt: 'A mysterious wanderer with knowledge of ancient magic',
    archetype: 'mystic',
    priority: 'quality'
  })
})

const npc = await npcResponse.json()

// 2. Generate additional dialogue
const dialogueResponse = await fetch('/api/generate-dialogue', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    context: 'Teaching the player a new spell',
    npcId: npc.id,
    maxDepth: 4
  })
})

const dialogue = await dialogueResponse.json()

// 3. Generate a quest for this NPC
const questResponse = await fetch('/api/generate-quest-layer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    questTitle: 'The Lost Spellbook',
    layerType: 'gameflow',
    relatedNpcIds: [npc.id]
  })
})

const quest = await questResponse.json()
```

### Error Handling Example

```typescript
try {
  const response = await fetch('/api/generate-npc-v2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'A brave knight',
      archetype: 'warrior'
    })
  })

  if (!response.ok) {
    const error = await response.json()

    if (response.status === 429) {
      // Rate limited - wait and retry
      await new Promise(resolve => setTimeout(resolve, 2000))
      // Retry logic here
    } else if (response.status === 400) {
      // Validation error - show to user
      console.error('Validation errors:', error.errors)
    } else {
      // Other error
      console.error('Error:', error.error)
    }

    return
  }

  const npc = await response.json()
  console.log('Generated NPC:', npc)

} catch (error) {
  // Network error
  console.error('Network error:', error)
}
```

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-repo/issues
- Documentation: https://docs.your-domain.com
