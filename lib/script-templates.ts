import type { NPCScript } from "./npc-types"

export const NPC_TEMPLATES: Record<string, Partial<NPCScript>> = {
  "quest-giver-merchant": {
    personality: {
      name: "Template Merchant",
      archetype: "merchant",
      traits: ["shrewd", "friendly", "opportunistic"],
      goals: ["maximize profit", "build reputation", "expand trade network"],
      fears: ["bankruptcy", "theft", "competition"],
      moralAlignment: "neutral-good",
    },
    behavior: {
      id: "merchant-behavior",
      name: "Merchant Daily Routine",
      schedule: [
        { time: "08:00", location: "market_square", activity: "opening_shop" },
        { time: "12:00", location: "market_square", activity: "trading" },
        { time: "18:00", location: "tavern", activity: "networking" },
        { time: "22:00", location: "home", activity: "resting" },
      ],
      reactions: [
        { trigger: "player_greeting", response: "friendly_welcome", priority: 1 },
        { trigger: "theft_attempt", response: "call_guards", priority: 10 },
      ],
      relationships: [],
    },
    elizaOSConfig: {
      agentId: "",
      memoryEnabled: true,
      autonomyLevel: "medium",
      decisionMakingModel: "openai/gpt-4o-mini",
    },
  },
  "warrior-companion": {
    personality: {
      name: "Template Warrior",
      archetype: "warrior",
      traits: ["brave", "loyal", "honorable", "protective"],
      goals: ["protect the weak", "prove valor", "serve kingdom"],
      fears: ["dishonor", "failure", "betrayal"],
      moralAlignment: "lawful-good",
    },
    behavior: {
      id: "warrior-behavior",
      name: "Warrior Combat Routine",
      schedule: [
        { time: "06:00", location: "training_grounds", activity: "training" },
        { time: "14:00", location: "city_gates", activity: "patrol" },
        { time: "20:00", location: "barracks", activity: "resting" },
      ],
      reactions: [
        { trigger: "combat_initiated", response: "engage_enemy", priority: 10 },
        { trigger: "ally_threatened", response: "defend_ally", priority: 9 },
      ],
      relationships: [],
    },
    elizaOSConfig: {
      agentId: "",
      memoryEnabled: true,
      autonomyLevel: "high",
      decisionMakingModel: "openai/gpt-4o-mini",
    },
  },
  "mystic-lorekeeper": {
    personality: {
      name: "Template Mystic",
      archetype: "mystic",
      traits: ["wise", "mysterious", "patient", "cryptic"],
      goals: ["preserve ancient knowledge", "guide seekers", "maintain balance"],
      fears: ["forgotten lore", "chaos", "ignorance"],
      moralAlignment: "true-neutral",
    },
    behavior: {
      id: "mystic-behavior",
      name: "Mystic Meditation Routine",
      schedule: [
        { time: "00:00", location: "temple", activity: "meditation" },
        { time: "10:00", location: "library", activity: "studying" },
        { time: "16:00", location: "temple", activity: "rituals" },
      ],
      reactions: [
        { trigger: "knowledge_sought", response: "cryptic_guidance", priority: 5 },
        { trigger: "sacred_site_disturbed", response: "warning", priority: 8 },
      ],
      relationships: [],
    },
    elizaOSConfig: {
      agentId: "",
      memoryEnabled: true,
      autonomyLevel: "medium",
      decisionMakingModel: "anthropic/claude-3-5-sonnet-20241022",
    },
  },
  "rogue-informant": {
    personality: {
      name: "Template Rogue",
      archetype: "rogue",
      traits: ["cunning", "secretive", "opportunistic", "charming"],
      goals: ["gather information", "profit from secrets", "avoid authorities"],
      fears: ["exposure", "betrayal", "imprisonment"],
      moralAlignment: "chaotic-neutral",
    },
    behavior: {
      id: "rogue-behavior",
      name: "Rogue Shadow Routine",
      schedule: [
        { time: "14:00", location: "market_shadows", activity: "observing" },
        { time: "20:00", location: "tavern_backroom", activity: "dealing" },
        { time: "02:00", location: "hideout", activity: "planning" },
      ],
      reactions: [
        { trigger: "information_request", response: "negotiate_price", priority: 7 },
        { trigger: "guards_approach", response: "vanish", priority: 10 },
      ],
      relationships: [],
    },
    elizaOSConfig: {
      agentId: "",
      memoryEnabled: true,
      autonomyLevel: "high",
      decisionMakingModel: "anthropic/claude-3-5-sonnet-20241022",
    },
  },
  "noble-diplomat": {
    personality: {
      name: "Template Noble",
      archetype: "noble",
      traits: ["eloquent", "calculating", "proud", "diplomatic"],
      goals: ["increase influence", "maintain status", "forge alliances"],
      fears: ["scandal", "loss of power", "social disgrace"],
      moralAlignment: "lawful-neutral",
    },
    behavior: {
      id: "noble-behavior",
      name: "Noble Court Routine",
      schedule: [
        { time: "10:00", location: "palace", activity: "court_session" },
        { time: "15:00", location: "garden", activity: "private_meetings" },
        { time: "19:00", location: "banquet_hall", activity: "socializing" },
      ],
      reactions: [
        { trigger: "political_opportunity", response: "strategic_engagement", priority: 8 },
        { trigger: "insult", response: "calculated_response", priority: 6 },
      ],
      relationships: [],
    },
    elizaOSConfig: {
      agentId: "",
      memoryEnabled: true,
      autonomyLevel: "medium",
      decisionMakingModel: "openai/gpt-4o",
    },
  },
  "scholar-researcher": {
    personality: {
      name: "Template Scholar",
      archetype: "scholar",
      traits: ["curious", "methodical", "absent-minded", "passionate"],
      goals: ["discover knowledge", "publish findings", "teach students"],
      fears: ["ignorance", "academic failure", "lost research"],
      moralAlignment: "neutral-good",
    },
    behavior: {
      id: "scholar-behavior",
      name: "Scholar Research Routine",
      schedule: [
        { time: "08:00", location: "library", activity: "research" },
        { time: "14:00", location: "laboratory", activity: "experiments" },
        { time: "18:00", location: "study", activity: "writing" },
      ],
      reactions: [
        { trigger: "rare_book_found", response: "intense_study", priority: 9 },
        { trigger: "research_question", response: "enthusiastic_explanation", priority: 5 },
      ],
      relationships: [],
    },
    elizaOSConfig: {
      agentId: "",
      memoryEnabled: true,
      autonomyLevel: "low",
      decisionMakingModel: "openai/gpt-4o-mini",
    },
  },
  "commoner-farmer": {
    personality: {
      name: "Template Farmer",
      archetype: "commoner",
      traits: ["hardworking", "practical", "superstitious", "hospitable"],
      goals: ["good harvest", "family safety", "community respect"],
      fears: ["crop failure", "bandits", "harsh weather"],
      moralAlignment: "lawful-good",
    },
    behavior: {
      id: "farmer-behavior",
      name: "Farmer Daily Routine",
      schedule: [
        { time: "05:00", location: "fields", activity: "farming" },
        { time: "12:00", location: "home", activity: "lunch" },
        { time: "18:00", location: "village_square", activity: "socializing" },
      ],
      reactions: [
        { trigger: "crop_threat", response: "seek_help", priority: 8 },
        { trigger: "traveler_arrival", response: "offer_hospitality", priority: 3 },
      ],
      relationships: [],
    },
    elizaOSConfig: {
      agentId: "",
      memoryEnabled: true,
      autonomyLevel: "low",
      decisionMakingModel: "openai/gpt-4o-mini",
    },
  },
}

export const QUEST_TEMPLATES = {
  "fetch-quest": {
    type: "fetch",
    structure: {
      objectives: [{ type: "fetch" as const, description: "Collect [ITEM]", quantity: 1 }],
      rewards: {
        experience: 100,
        gold: 50,
      },
    },
  },
  "kill-quest": {
    type: "combat",
    structure: {
      objectives: [{ type: "kill" as const, description: "Defeat [ENEMY]", quantity: 5 }],
      rewards: {
        experience: 200,
        gold: 100,
      },
    },
  },
  "discovery-quest": {
    type: "exploration",
    structure: {
      objectives: [{ type: "discover" as const, description: "Find [LOCATION]" }],
      rewards: {
        experience: 150,
        gold: 75,
      },
    },
  },
  "epic-dragon-alliance": {
    title: "The Dragon's Pact",
    layers: {
      gameflow: {
        objectives: [
          {
            id: "obj1",
            type: "discover" as const,
            description: "Find the Dragon's Lair in the Northern Mountains",
            location: "northern_mountains",
            optional: false,
          },
          {
            id: "obj2",
            type: "social" as const,
            description: "Negotiate with the Dragon Elder",
            target: "dragon_elder",
            optional: false,
          },
          {
            id: "obj3",
            type: "fetch" as const,
            description: "Retrieve the Ancient Treaty Scroll",
            target: "treaty_scroll",
            quantity: 1,
            optional: false,
          },
        ],
        branches: [
          {
            id: "branch1",
            condition: "player_chooses_alliance",
            outcomes: {
              success: ["dragon_faction_ally", "unlock_dragon_mount"],
              failure: ["dragon_faction_hostile", "war_event_triggered"],
            },
          },
        ],
        triggers: [],
        rewards: {
          experience: 5000,
          gold: 1000,
          reputation: [{ faction: "dragons", amount: 100 }],
          unlocks: ["dragon_mount_quest", "dragon_language_skill"],
        },
        difficulty: "epic" as const,
        estimatedDuration: 120,
      },
      lore: {
        summary:
          "An ancient pact between humans and dragons, broken centuries ago, can be restored to prevent an impending war.",
        relevantHistory: ["dragon_war_500_years_ago", "treaty_of_flames", "dragon_elder_exile"],
        factions: [
          { name: "Dragon Council", involvement: "Primary negotiators", stance: "neutral" as const },
          { name: "Northern Kingdom", involvement: "Historical enemies", stance: "opposed" as const },
        ],
        artifacts: [
          {
            name: "Treaty of Flames",
            significance: "Original peace agreement between species",
            location: "dragon_archives",
          },
        ],
        culturalContext: "Dragons value honor and ancient oaths above all else",
      },
      history: {
        timeline: [
          {
            id: "event1",
            date: "Year 523",
            title: "The Great Dragon War",
            description: "Humans and dragons fought for dominance",
            participants: ["human_kingdoms", "dragon_clans"],
            location: "northern_territories",
            impact: "world-changing" as const,
          },
        ],
        precedingEvents: ["dragon_territory_expansion", "human_settlement_conflicts"],
        consequences: ["centuries_of_mistrust", "isolated_dragon_society"],
        historicalFigures: [
          {
            name: "King Aldric the Peacemaker",
            role: "Human negotiator",
            relevance: "Signed original treaty",
          },
        ],
      },
      relationships: {
        npcRelationships: [
          {
            npcId: "dragon_elder_001",
            name: "Zephyrax the Ancient",
            relationship: "neutral" as const,
            strength: 0,
            history: "Witnessed the original treaty signing",
            questRole: "giver" as const,
          },
        ],
        factionDynamics: [
          {
            faction1: "dragons",
            faction2: "northern_kingdom",
            relationship: "Historical enemies seeking peace",
            tension: 75,
          },
        ],
        playerRelationships: {
          requiredReputation: [{ faction: "dragons", minimum: 50 }],
          affectedBy: ["dragon_rescue_quest", "dragon_artifact_return"],
        },
      },
    },
  },
  "mystery-murder-investigation": {
    title: "The Merchant's Last Deal",
    layers: {
      gameflow: {
        objectives: [
          {
            id: "obj1",
            type: "social" as const,
            description: "Interview witnesses at the crime scene",
            location: "merchant_district",
            optional: false,
          },
          {
            id: "obj2",
            type: "fetch" as const,
            description: "Collect evidence from the warehouse",
            target: "evidence",
            quantity: 5,
            optional: false,
          },
          {
            id: "obj3",
            type: "puzzle" as const,
            description: "Solve the cipher in the merchant's ledger",
            optional: false,
          },
        ],
        branches: [
          {
            id: "branch1",
            condition: "accuse_correct_suspect",
            outcomes: {
              success: ["justice_served", "reputation_increase"],
              failure: ["innocent_imprisoned", "reputation_decrease"],
              alternative: ["real_killer_escapes", "quest_chain_continues"],
            },
          },
        ],
        triggers: [],
        rewards: {
          experience: 1500,
          gold: 500,
          reputation: [{ faction: "city_guard", amount: 50 }],
        },
        difficulty: "medium" as const,
        estimatedDuration: 45,
      },
      lore: {
        summary: "A wealthy merchant's murder reveals a web of corruption in the city's trade guilds.",
        relevantHistory: ["guild_wars", "trade_monopoly_establishment"],
        factions: [
          { name: "Merchant Guild", involvement: "Victim's organization", stance: "supportive" as const },
          { name: "Thieves Guild", involvement: "Suspected perpetrators", stance: "opposed" as const },
        ],
        artifacts: [
          {
            name: "Encrypted Ledger",
            significance: "Contains evidence of illegal trade",
            location: "merchant_office",
          },
        ],
        culturalContext: "Merchant guilds hold significant political power in the city",
      },
      history: {
        timeline: [
          {
            id: "event1",
            date: "3 months ago",
            title: "Guild Merger Proposal",
            description: "Victim proposed controversial guild merger",
            participants: ["merchant_guild", "artisan_guild"],
            location: "guild_hall",
            impact: "moderate" as const,
          },
        ],
        precedingEvents: ["trade_route_disputes", "guild_leadership_changes"],
        consequences: ["guild_power_struggle", "economic_instability"],
        historicalFigures: [
          {
            name: "Marcus Goldweaver",
            role: "Murder victim",
            relevance: "Influential merchant and reformer",
          },
        ],
      },
      relationships: {
        npcRelationships: [
          {
            npcId: "guard_captain_001",
            name: "Captain Helena Ironheart",
            relationship: "ally" as const,
            strength: 60,
            history: "Worked together on previous cases",
            questRole: "helper" as const,
          },
          {
            npcId: "rival_merchant_001",
            name: "Silas Darkgold",
            relationship: "rival" as const,
            strength: -40,
            history: "Business competitor of the victim",
            questRole: "obstacle" as const,
          },
        ],
        factionDynamics: [
          {
            faction1: "merchant_guild",
            faction2: "thieves_guild",
            relationship: "Mutual suspicion and conflict",
            tension: 80,
          },
        ],
        playerRelationships: {
          affectedBy: ["city_guard_reputation_quests"],
        },
      },
    },
  },
}

export const DIALOGUE_TEMPLATES = {
  greeting: {
    friendly: [
      "Well met, traveler! What brings you to these parts?",
      "Ah, a new face! Welcome, welcome!",
      "Greetings, friend. How may I assist you today?",
    ],
    neutral: ["Yes? What do you want?", "State your business.", "I'm listening."],
    hostile: ["You're not welcome here.", "Leave, before I make you.", "What do YOU want?"],
  },
  questOffer: {
    urgent: [
      "Please, you must help! There's no time to waste!",
      "I need someone capable, and fast. Are you interested?",
      "This is a matter of life and death. Will you aid me?",
    ],
    casual: [
      "I have a proposition for you, if you're interested.",
      "Looking for work? I might have something.",
      "Care to earn some coin? I have a task that needs doing.",
    ],
    mysterious: [
      "I've been expecting someone like you...",
      "Fate has brought you here. Will you accept your destiny?",
      "There are forces at work beyond your understanding. But you can help.",
    ],
  },
  farewell: {
    friendly: ["Safe travels, friend!", "May fortune smile upon you!", "Until we meet again!"],
    neutral: ["Farewell.", "Good day.", "We're done here."],
    hostile: ["Get out of my sight.", "Don't come back.", "Leave. Now."],
  },
}
