import { generateText } from "ai"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { npcScript, playerInput } = await request.json()

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `You are roleplaying as an NPC in a game.

NPC Details:
- Name: ${npcScript.personality.name}
- Archetype: ${npcScript.personality.archetype}
- Traits: ${npcScript.personality.traits.join(", ")}
- Goals: ${npcScript.personality.goals.join(", ")}
- Moral Alignment: ${npcScript.personality.moralAlignment}

Available Dialogues:
${npcScript.dialogues.map((d: any) => `- ${d.text}`).join("\n")}

Player says: "${playerInput}"

Respond in character as this NPC. Keep it brief (1-2 sentences) and stay true to the personality.`,
    })

    return NextResponse.json({
      response: text,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Simulation error:", error)
    return NextResponse.json({ error: "Failed to simulate interaction" }, { status: 500 })
  }
}
