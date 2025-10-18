"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, AlertTriangle, Play, Loader2 } from "lucide-react"
import { useNPCStore } from "@/lib/stores/npc-store"
import { useQuestStore } from "@/lib/stores/quest-store"
import { useLoreStore } from "@/lib/stores/lore-store"
import { toast } from "@/hooks/use-toast"

interface ValidationResult {
  category: string
  passed: number
  failed: number
  warnings: number
  tests: {
    name: string
    status: "pass" | "fail" | "warning"
    message: string
  }[]
}

export function ValidationSuite() {
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<ValidationResult[]>([])

  const npcs = useNPCStore((state) => state.npcs)
  const quests = useQuestStore((state) => state.quests)
  const loreEntries = useLoreStore((state) => state.loreEntries)

  const runValidation = async () => {
    setRunning(true)
    setResults([])

    try {
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch("/api/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          npcs,
          quests,
          loreEntries,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Validate response structure
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error("Invalid response format: missing results array")
      }

      // Validate each result has required fields
      for (const result of data.results) {
        if (!result.category || typeof result.passed !== "number" ||
            typeof result.failed !== "number" || typeof result.warnings !== "number" ||
            !Array.isArray(result.tests)) {
          throw new Error("Invalid result format in validation response")
        }
      }

      setResults(data.results)

      // Show success toast
      const totalPassed = data.results.reduce((sum: number, r: ValidationResult) => sum + r.passed, 0)
      const totalFailed = data.results.reduce((sum: number, r: ValidationResult) => sum + r.failed, 0)
      const totalWarnings = data.results.reduce((sum: number, r: ValidationResult) => sum + r.warnings, 0)

      toast({
        title: "Validation Complete",
        description: `${totalPassed} passed, ${totalFailed} failed, ${totalWarnings} warnings`,
        variant: totalFailed > 0 ? "destructive" : "default",
      })
    } catch (error) {
      console.error("Validation failed:", error)

      let errorMessage = "Failed to run validation"
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = "Validation timed out after 30 seconds"
        } else {
          errorMessage = error.message
        }
      }

      toast({
        title: "Validation Failed",
        description: errorMessage,
        variant: "destructive",
      })

      setResults([])
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Content Validation</h3>
          <Button onClick={runValidation} disabled={running}>
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Validation Suite
              </>
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-border bg-background">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{result.category}</h4>
                  <div className="flex gap-2">
                    <Badge variant="default" className="bg-green-500">
                      {result.passed} passed
                    </Badge>
                    {result.failed > 0 && <Badge variant="destructive">{result.failed} failed</Badge>}
                    {result.warnings > 0 && (
                      <Badge variant="secondary" className="bg-yellow-500">
                        {result.warnings} warnings
                      </Badge>
                    )}
                  </div>
                </div>
                <Progress
                  value={(() => {
                    const total = result.passed + result.failed + result.warnings
                    return total === 0 ? 0 : (result.passed / total) * 100
                  })()}
                  className="mb-3"
                />
                <div className="space-y-2">
                  {result.tests.map((test, testIdx) => (
                    <div key={testIdx} className="flex items-start gap-2 text-sm">
                      {test.status === "pass" && <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />}
                      {test.status === "fail" && <XCircle className="h-4 w-4 text-red-500 mt-0.5" />}
                      {test.status === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />}
                      <div>
                        <p className="font-medium">{test.name}</p>
                        <p className="text-muted-foreground text-xs">{test.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
