import { generateText } from "ai"
import { getModelForTask } from "@/lib/ai-router"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { context, existingNodes, model: customModel } = body

    // Input validation
    if (!context || typeof context !== "string" || context.trim() === "") {
      return Response.json(
        { error: "Invalid input: 'context' must be a non-empty string" },
        { status: 400 }
      )
    }

    if (!Array.isArray(existingNodes)) {
      return Response.json(
        { error: "Invalid input: 'existingNodes' must be an array" },
        { status: 400 }
      )
    }

    if (customModel !== undefined && typeof customModel !== "string") {
      return Response.json(
        { error: "Invalid input: 'model' must be a string if provided" },
        { status: 400 }
      )
    }

    const selectedModel = getModelForTask("dialogue_tree", customModel, "quality")

    let text: string
    try {
      const result = await generateText({
        model: selectedModel,
        prompt: `Generate dialogue tree nodes for context: "${context}"

Existing nodes:
${existingNodes.map((n: any) => `${n.id}: "${n.text}"`).join("\n")}

Create 3-5 new dialogue nodes that expand the conversation naturally. Each node should have:
- Unique ID
- Dialogue text
- 2-3 response options with next node IDs

Return as JSON array of DialogueNode objects:
[
  {
    "id": "node_id",
    "text": "dialogue text",
    "responses": [
      {"text": "response text", "nextNodeId": "next_id", "effects": []}
    ]
  }
]`,
        temperature: 0.8,
      })
      text = result.text
    } catch (error) {
      console.error("AI generation error:", error)
      return Response.json(
        { error: "Failed to generate dialogue from AI service" },
        { status: 500 }
      )
    }

    let nodes
    try {
      nodes = JSON.parse(text)
    } catch (error) {
      console.error("JSON parse error - AI returned invalid JSON:", { text, error })
      return Response.json(
        { error: "Invalid AI response: could not parse JSON" },
        { status: 502 }
      )
    }

    return Response.json({ nodes })
  } catch (error) {
    console.error("Dialogue generation error:", error)
    return Response.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
