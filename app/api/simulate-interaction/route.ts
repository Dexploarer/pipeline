import { generateText } from "ai"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { npcScript, playerInput } = await request.json()

    // Defensive guards for npcScript and nested properties
    if (!npcScript || typeof npcScript !== "object") {
      return NextResponse.json({ error: "Invalid NPC script provided" }, { status: 400 })
    }

    // Sanitize playerInput
    const sanitizedInput = typeof playerInput === "string"
      ? playerInput.trim().substring(0, 500)
      : ""

    if (!sanitizedInput) {
      return NextResponse.json({ error: "Player input is required" }, { status: 400 })
    }

    // Extract personality info with safe fallbacks
    const personality = npcScript.personality || {}
    const name = personality.name || "Unknown NPC"
    const archetype = personality.archetype || "Generic"
    const traits = Array.isArray(personality.traits) ? personality.traits : []
    const goals = Array.isArray(personality.goals) ? personality.goals : []
    const moralAlignment = personality.moralAlignment || "Neutral"

    // Extract dialogues with safe fallbacks
    const dialogues = Array.isArray(npcScript.dialogues) ? npcScript.dialogues : []
    const dialogueTexts = dialogues
      .map((d: any) => d?.text)
      .filter((text: any): text is string => typeof text === "string")

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `You are roleplaying as an NPC in a game.

NPC Details:
- Name: ${name}
- Archetype: ${archetype}
- Traits: ${traits.length > 0 ? traits.join(", ") : "None specified"}
- Goals: ${goals.length > 0 ? goals.join(", ") : "None specified"}
- Moral Alignment: ${moralAlignment}

${dialogueTexts.length > 0 ? `Available Dialogues:\n${dialogueTexts.map((text: string) => `- ${text}`).join("\n")}` : ""}

Player says: "${sanitizedInput}"

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
