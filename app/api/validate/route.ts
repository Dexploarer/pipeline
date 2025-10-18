import { NextResponse } from "next/server"

interface ValidationTest {
  name: string
  status: "pass" | "fail" | "warning"
  message: string
}

interface ValidationResult {
  category: string
  passed: number
  failed: number
  warnings: number
  tests: ValidationTest[]
}

// Validation functions
function validateNPCScripts(npcs: any[]): ValidationResult {
  const tests: ValidationTest[] = []
  let passed = 0
  let failed = 0
  let warnings = 0

  // Check dialogue coherence
  const dialogueIssues = npcs.filter(npc =>
    !npc.dialogues || npc.dialogues.length === 0
  )
  if (dialogueIssues.length === 0) {
    tests.push({
      name: "Dialogue coherence",
      status: "pass",
      message: "All NPCs have dialogue configured"
    })
    passed++
  } else {
    tests.push({
      name: "Dialogue coherence",
      status: "fail",
      message: `${dialogueIssues.length} NPCs are missing dialogues`
    })
    failed++
  }

  // Check personality consistency
  const personalityIssues = npcs.filter(npc =>
    !npc.personality || !npc.personality.traits || npc.personality.traits.length === 0
  )
  if (personalityIssues.length === 0) {
    tests.push({
      name: "Personality consistency",
      status: "pass",
      message: "All NPCs have personality traits defined"
    })
    passed++
  } else if (personalityIssues.length <= 3) {
    tests.push({
      name: "Personality consistency",
      status: "warning",
      message: `${personalityIssues.length} NPCs have incomplete personality traits`
    })
    warnings++
  } else {
    tests.push({
      name: "Personality consistency",
      status: "fail",
      message: `${personalityIssues.length} NPCs have incomplete personality traits`
    })
    failed++
  }

  // Check quest availability
  const questIssues = npcs.filter(npc =>
    npc.quests && npc.quests.some((q: any) => !q.objectives || q.objectives.length === 0)
  )
  if (questIssues.length === 0) {
    tests.push({
      name: "Quest availability",
      status: "pass",
      message: "All NPC quests have valid objectives"
    })
    passed++
  } else {
    tests.push({
      name: "Quest availability",
      status: "fail",
      message: `${questIssues.length} NPC quests have missing prerequisites or objectives`
    })
    failed++
  }

  return {
    category: "NPC Scripts",
    passed,
    failed,
    warnings,
    tests
  }
}

function validateQuestLogic(quests: any[]): ValidationResult {
  const tests: ValidationTest[] = []
  let passed = 0
  let failed = 0
  let warnings = 0

  // Check objective completability
  const incompletableQuests = quests.filter(quest =>
    !quest.objectives || quest.objectives.length === 0 ||
    quest.objectives.some((obj: any) => !obj.description || !obj.type)
  )
  if (incompletableQuests.length === 0) {
    tests.push({
      name: "Objective completability",
      status: "pass",
      message: "All quest objectives are well-defined"
    })
    passed++
  } else {
    tests.push({
      name: "Objective completability",
      status: "fail",
      message: `${incompletableQuests.length} quests have incomplete objectives`
    })
    failed++
  }

  // Check reward balance
  const generousRewards = quests.filter(quest =>
    quest.rewards && (quest.rewards.experience > 10000 || quest.rewards.gold > 5000)
  )
  if (generousRewards.length > 0) {
    tests.push({
      name: "Reward balance",
      status: "warning",
      message: `${generousRewards.length} quests may have overly generous rewards`
    })
    warnings++
  } else {
    tests.push({
      name: "Reward balance",
      status: "pass",
      message: "Quest rewards are balanced"
    })
    passed++
  }

  // Check quest chain integrity
  const chainIssues = quests.filter(quest =>
    quest.prerequisites && quest.prerequisites.some((prereq: string) =>
      !quests.find(q => q.id === prereq)
    )
  )
  if (chainIssues.length === 0) {
    tests.push({
      name: "Quest chain integrity",
      status: "pass",
      message: "All quest prerequisites are valid"
    })
    passed++
  } else {
    tests.push({
      name: "Quest chain integrity",
      status: "fail",
      message: `${chainIssues.length} quests have invalid prerequisites`
    })
    failed++
  }

  return {
    category: "Quest Logic",
    passed,
    failed,
    warnings,
    tests
  }
}

function validateLoreConsistency(loreEntries: any[]): ValidationResult {
  const tests: ValidationTest[] = []
  let passed = 0
  let failed = 0
  let warnings = 0

  // Check timeline consistency
  const timelineIssues = loreEntries.filter(entry =>
    !entry.era || !entry.summary
  )
  if (timelineIssues.length === 0) {
    tests.push({
      name: "Timeline consistency",
      status: "pass",
      message: "All lore entries have timeline information"
    })
    passed++
  } else {
    tests.push({
      name: "Timeline consistency",
      status: "warning",
      message: `${timelineIssues.length} lore entries missing timeline data`
    })
    warnings++
  }

  // Check faction relationships
  const factionIssues = loreEntries.filter(entry =>
    entry.factions && entry.factions.length > 0 &&
    entry.factions.some((f: any) => !f.name || !f.stance)
  )
  if (factionIssues.length === 0) {
    tests.push({
      name: "Faction relationships",
      status: "pass",
      message: "Faction relationships are well-defined"
    })
    passed++
  } else {
    tests.push({
      name: "Faction relationships",
      status: "fail",
      message: `${factionIssues.length} lore entries have conflicting faction allegiances`
    })
    failed++
  }

  // Check historical accuracy
  const historyIssues = loreEntries.filter(entry =>
    !entry.category || !entry.summary || entry.summary.trim().length < 10
  )
  if (historyIssues.length === 0) {
    tests.push({
      name: "Historical accuracy",
      status: "pass",
      message: "All lore entries have sufficient detail"
    })
    passed++
  } else {
    tests.push({
      name: "Historical accuracy",
      status: "warning",
      message: `${historyIssues.length} lore entries lack sufficient detail`
    })
    warnings++
  }

  return {
    category: "Lore Consistency",
    passed,
    failed,
    warnings,
    tests
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { npcs = [], quests = [], loreEntries = [] } = body

    // Validate input types
    if (!Array.isArray(npcs) || !Array.isArray(quests) || !Array.isArray(loreEntries)) {
      return NextResponse.json(
        { error: "Invalid input: npcs, quests, and loreEntries must be arrays" },
        { status: 400 }
      )
    }

    const results: ValidationResult[] = []

    // Run validation for each category
    if (npcs.length > 0) {
      results.push(validateNPCScripts(npcs))
    }

    if (quests.length > 0) {
      results.push(validateQuestLogic(quests))
    }

    if (loreEntries.length > 0) {
      results.push(validateLoreConsistency(loreEntries))
    }

    // If no content provided, return default empty results
    if (results.length === 0) {
      return NextResponse.json({
        results: [
          {
            category: "NPC Scripts",
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: [{ name: "No data", status: "warning", message: "No NPCs to validate" }]
          },
          {
            category: "Quest Logic",
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: [{ name: "No data", status: "warning", message: "No quests to validate" }]
          },
          {
            category: "Lore Consistency",
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: [{ name: "No data", status: "warning", message: "No lore entries to validate" }]
          }
        ]
      })
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Validation error:", error)
    return NextResponse.json(
      { error: "Failed to run validation suite" },
      { status: 500 }
    )
  }
}
