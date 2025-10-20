"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Zap, Upload, Download, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface BatchJob {
  id: string
  type: string
  total: number
  completed: number
  failed: number
  status: "pending" | "processing" | "completed" | "failed"
}

export function BatchProcessor() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [batchType, setBatchType] = useState("npc")
  const [quantity, setQuantity] = useState("10")
  const [processing, setProcessing] = useState(false)
  const [jobs, setJobs] = useState<BatchJob[]>([])

  const handleBatchGenerate = async () => {
    setProcessing(true)
    const newJob: BatchJob = {
      id: `batch_${Date.now()}`,
      type: batchType,
      total: Number.parseInt(quantity),
      completed: 0,
      failed: 0,
      status: "processing",
    }
    setJobs((prev) => [newJob, ...prev])

    // Simulate batch processing
    const total = Number.parseInt(quantity)
    for (let i = 0; i < total; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setJobs((prev) =>
        prev.map((job) =>
          job.id === newJob.id
            ? {
                ...job,
                completed: i + 1,
                status: i + 1 === total ? "completed" : "processing",
              }
            : job,
        ),
      )
    }
    setProcessing(false)
  }

  const handleImportCSV = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result !== "string") return

      // Use papaparse for robust CSV parsing
      import("papaparse").then((Papa) => {
        Papa.default.parse(result, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              toast({
                title: "CSV Parse Error",
                description: `Failed to parse CSV: ${results.errors[0]?.message || "Unknown error"}`,
                variant: "destructive",
              })
              return
            }

            const rowCount = results.data.length

            toast({
              title: "CSV Imported",
              description: `Successfully loaded ${rowCount} entries from ${file.name}`,
            })

            // Process the parsed CSV data
            processImportedData(results.data)
          },
          error: (error: Error) => {
            toast({
              title: "CSV Import Failed",
              description: `Error reading CSV: ${error.message}`,
              variant: "destructive",
            })
          },
        })
      })
    }
    reader.readAsText(file)
  }

  const processImportedData = (data: unknown[]) => {
    // Create a new batch job for the imported data
    const newJob: BatchJob = {
      id: `import_${Date.now()}`,
      type: "import",
      total: data.length,
      completed: 0,
      failed: 0,
      status: "processing",
    }
    setJobs((prev) => [newJob, ...prev])

    // Simulate processing each row of imported data
    let processed = 0
    const processNextBatch = () => {
      const batchSize = 10
      const endIndex = Math.min(processed + batchSize, data.length)

      for (let i = processed; i < endIndex; i++) {
        // TODO: Actually process each row of data
        // - Validate data against schema
        // - Transform data into required format
        // - Store in database or state
        // - Handle any processing errors
        console.log(`Processing row ${i + 1}:`, data[i])
      }

      processed = endIndex
      setJobs((prev) =>
        prev.map((job) =>
          job.id === newJob.id
            ? {
                ...job,
                completed: processed,
                status: processed === data.length ? "completed" : "processing",
              }
            : job,
        ),
      )

      if (processed < data.length) {
        setTimeout(processNextBatch, 100)
      }
    }

    processNextBatch()
  }

  const handleExportResults = (job: BatchJob) => {
    const results = {
      jobId: job.id,
      type: job.type,
      completed: job.completed,
      total: job.total,
      timestamp: Date.now(),
      items: Array.from({ length: job.completed }, (_, i) => ({
        id: `${job.type}_${i + 1}`,
        name: `Generated ${job.type} ${i + 1}`,
      })),
    }

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `batch-${job.type}-results.json`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Results Exported",
      description: `Exported ${job.completed} ${job.type} items`,
    })
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 border-border bg-card">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Batch Processing</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Content Type</Label>
              <Select value={batchType} onValueChange={setBatchType}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="npc">NPCs</SelectItem>
                  <SelectItem value="quest">Quests</SelectItem>
                  <SelectItem value="dialogue">Dialogues</SelectItem>
                  <SelectItem value="lore">Lore Entries</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                max="100"
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleBatchGenerate} disabled={processing} className="flex-1">
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Generate Batch
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleImportCSV}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          </div>
        </div>
      </Card>

      {jobs.length > 0 && (
        <Card className="p-6 border-border bg-card">
          <h4 className="font-semibold mb-4">Batch Jobs</h4>
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="p-4 rounded-lg border border-border bg-background">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{job.type} Generation</span>
                    {job.status === "completed" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {job.status === "failed" && <XCircle className="h-4 w-4 text-red-500" />}
                    {job.status === "processing" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {job.completed}/{job.total}
                  </span>
                </div>
                <Progress value={(job.completed / job.total) * 100} className="h-2" />
                {job.status === "completed" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 bg-transparent"
                    onClick={() => handleExportResults(job)}
                  >
                    <Download className="mr-2 h-3 w-3" />
                    Export Results
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
