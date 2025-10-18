import { cache } from "../cache/client"
import { generateHash } from "../cache/strategy"

// Generate embedding for text using AI SDK
export async function generateEmbedding(text: string): Promise<number[]> {
  // Validate API key is present
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("Missing OPENAI_API_KEY environment variable")
  }

  // Clean and normalize text
  const cleanText = text.trim().slice(0, 8000) // Limit to 8k chars

  // Check cache first
  const cacheKey = `embedding:${generateHash(cleanText)}`
  const cached = await cache.get<number[]>(cacheKey)
  if (cached) {
    return cached
  }

  try {
    // Generate embedding using OpenAI
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: cleanText,
      }),
    })

    // Validate response status
    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(
        `OpenAI API request failed with status ${response.status}: ${response.statusText}. Body: ${errorBody}`
      )
    }

    const data = await response.json()

    // Validate response structure
    if (!data || !Array.isArray(data.data) || data.data.length === 0) {
      throw new Error("Invalid response from OpenAI API: missing or empty data array")
    }

    if (!data.data[0].embedding || !Array.isArray(data.data[0].embedding)) {
      throw new Error("Invalid response from OpenAI API: missing or invalid embedding")
    }

    const embedding = data.data[0].embedding

    // Cache for 24 hours
    await cache.set(cacheKey, embedding, 86400)

    return embedding
  } catch (error) {
    console.error("[v0] Embedding generation error:", error)
    throw error
  }
}

// Generate embeddings in batch
export async function generateBatchEmbeddings(texts: string[], batchSize = 100): Promise<number[][]> {
  const embeddings: number[][] = []

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const batchEmbeddings = await Promise.all(batch.map((text) => generateEmbedding(text)))
    embeddings.push(...batchEmbeddings)

    // Rate limiting delay
    if (i + batchSize < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return embeddings
}
