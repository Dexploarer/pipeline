import { AssetTypes, AssetLimits } from "./storage-schema"
import { put } from "@vercel/blob"

export interface UploadOptions {
  entityType: "npc" | "zone" | "quest" | "pack"
  entityId: string
  assetType: "portrait" | "icon" | "map" | "audio" | "model-ref" | "bundle"
  file: File
  onProgress?: (progress: number) => void
}

export interface UploadResult {
  url: string
  size: number
  contentType: string
}

// Validate file before upload
function validateFile(file: File, _assetType: string): void {
  // Check file type
  const isImage = AssetTypes.IMAGE.includes(file.type)
  const isAudio = AssetTypes.AUDIO.includes(file.type)
  const isText = AssetTypes.TEXT.includes(file.type)
  const isArchive = AssetTypes.ARCHIVE.includes(file.type)

  if (!isImage && !isAudio && !isText && !isArchive) {
    throw new Error(`Invalid file type: ${file.type}`)
  }

  // Check file size
  let maxSize = AssetLimits.IMAGE
  if (isAudio) {
    maxSize = AssetLimits.AUDIO
  }
  if (isText) {
    maxSize = AssetLimits.TEXT
  }
  if (isArchive) {
    maxSize = AssetLimits.ARCHIVE
  }

  if (file.size > maxSize) {
    throw new Error(
      `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max: ${(maxSize / 1024 / 1024).toFixed(0)}MB)`,
    )
  }
}

// Sanitize filename to prevent path traversal
function sanitizeFilename(filename: string): string {
  // Get basename (remove any directory components)
  const basename = filename.split(/[/\\]/).pop() || "file"

  // Remove or replace dangerous characters
  // Keep alphanumeric, dots, hyphens, underscores
  return basename
    .replace(/\.\./g, "") // Remove ..
    .replace(/[^\w.-]/g, "_") // Replace unsafe chars with underscore
    .replace(/^\.+/, "") // Remove leading dots
    .slice(0, 255) // Limit length
}

// Upload asset to Vercel Blob
export async function uploadAsset(options: UploadOptions): Promise<UploadResult> {
  const { entityType, entityId, assetType, file, onProgress } = options

  try {
    // Validate file
    validateFile(file, assetType)

    // Sanitize filename to prevent path traversal
    const safeFilename = sanitizeFilename(file.name)

    // Generate path with sanitized inputs
    const path = `${entityType}s/${entityId}/${assetType}-${safeFilename}`

    // Upload to Blob
    const blob = await put(path, file, {
      access: "public",
      addRandomSuffix: false,
    })

    // Simulate progress (Vercel Blob doesn't provide real progress)
    onProgress?.(100)

    return {
      url: blob.url,
      size: file.size,
      contentType: file.type,
    }
  } catch (error) {
    console.error("[v0] Asset upload error:", error)
    throw error
  }
}

// Upload multiple assets
export async function uploadAssetsBatch(
  uploads: UploadOptions[],
  onBatchProgress?: (completed: number, total: number) => void,
): Promise<UploadResult[]> {
  const results: UploadResult[] = []

  for (let i = 0; i < uploads.length; i++) {
    const upload = uploads[i]
    if (upload === undefined) {
      continue
    }
    try {
      const result = await uploadAsset(upload)
      results.push(result)

      if (onBatchProgress !== undefined) {
        onBatchProgress(i + 1, uploads.length)
      }
    } catch (error) {
      console.error(`[v0] Failed to upload asset ${i + 1}:`, error)
      throw error
    }
  }

  return results
}

// Store external 3D model reference
export async function storeModelReference(entityType: string, entityId: string, modelUrl: string): Promise<string> {
  try {
    const path = `${entityType}s/${entityId}/model-url.txt`

    const blob = await put(path, modelUrl, {
      access: "public",
      addRandomSuffix: false,
      contentType: "text/plain",
    })

    return blob.url
  } catch (error) {
    console.error(`[v0] Model reference storage error for ${entityType}:${entityId}:`, error)
    throw error
  }
}
