"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, X, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { uploadAsset } from "@/lib/assets/uploader"

interface AssetUploaderProps {
  entityType: "npc" | "zone" | "quest"
  entityId: string
  assetType: "portrait" | "icon" | "map" | "audio"
  onUploadComplete?: (url: string) => void
}

export function AssetUploader({ entityType, entityId, assetType, onUploadComplete }: AssetUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setUploadedUrl(null)
    }
  }, [])

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      const result = await uploadAsset({
        entityType,
        entityId,
        assetType,
        file,
        onProgress: setProgress,
      })

      setUploadedUrl(result.url)
      onUploadComplete?.(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleClear = () => {
    setFile(null)
    setUploadedUrl(null)
    setError(null)
    setProgress(0)
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium capitalize">{assetType} Upload</h3>
          {uploadedUrl && <CheckCircle2 className="h-5 w-5 text-green-500" />}
        </div>

        {!file && !uploadedUrl && (
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-8 transition-colors hover:border-primary">
            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Click to select file</span>
            <input type="file" className="hidden" onChange={handleFileSelect} accept="image/*,audio/*" />
          </label>
        )}

        {file && !uploadedUrl && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex-1 truncate text-sm">{file.name}</div>
              <Button variant="ghost" size="sm" onClick={handleClear}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-center text-sm text-muted-foreground">{progress}%</p>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button onClick={handleUpload} disabled={uploading} className="w-full">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </div>
        )}

        {uploadedUrl && (
          <div className="space-y-3">
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Uploaded successfully</p>
              <a
                href={uploadedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View asset
              </a>
            </div>
            <Button variant="outline" onClick={handleClear} className="w-full bg-transparent">
              Upload Another
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
