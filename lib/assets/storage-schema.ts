/**
 * Validates and sanitizes an ID to prevent path traversal attacks.
 * Only allows alphanumeric characters, underscores, and hyphens.
 * @throws {Error} if the ID contains disallowed characters
 */
function sanitizeId(id: string, fieldName: string = "ID"): string {
  if (!id || typeof id !== "string") {
    throw new Error(`${fieldName} must be a non-empty string`);
  }

  // Check for path traversal attempts and other unsafe characters
  const allowedPattern = /^[A-Za-z0-9_-]+$/;
  if (!allowedPattern.test(id)) {
    throw new Error(
      `${fieldName} contains invalid characters. Only alphanumeric characters, underscores, and hyphens are allowed. Received: "${id}"`
    );
  }

  return id;
}

export const AssetPaths = {
  // NPC assets
  NPC_PORTRAIT: (npcId: string) => `npcs/${sanitizeId(npcId, "npcId")}/portrait.jpg`,
  NPC_ICON: (npcId: string) => `npcs/${sanitizeId(npcId, "npcId")}/icon.png`,
  NPC_MODEL_REF: (npcId: string) => `npcs/${sanitizeId(npcId, "npcId")}/model-url.txt`,
  NPC_VOICE: (npcId: string, filename: string) =>
    `npcs/${sanitizeId(npcId, "npcId")}/voice/${sanitizeId(filename, "filename")}`,

  // Zone assets
  ZONE_MAP: (zoneId: string) => `zones/${sanitizeId(zoneId, "zoneId")}/map.png`,
  ZONE_THUMBNAIL: (zoneId: string) => `zones/${sanitizeId(zoneId, "zoneId")}/thumbnail.jpg`,
  ZONE_MODEL_REF: (zoneId: string) => `zones/${sanitizeId(zoneId, "zoneId")}/environment-url.txt`,
  ZONE_AMBIENT: (zoneId: string) => `zones/${sanitizeId(zoneId, "zoneId")}/ambient.mp3`,

  // Quest assets
  QUEST_ICON: (questId: string) => `quests/${sanitizeId(questId, "questId")}/icon.png`,
  QUEST_BANNER: (questId: string) => `quests/${sanitizeId(questId, "questId")}/banner.jpg`,

  // Content pack bundles
  CONTENT_PACK: (packId: string) => `content-packs/${sanitizeId(packId, "packId")}/bundle.zip`,
  PACK_MANIFEST: (packId: string) => `content-packs/${packId}/manifest.json`,
  PACK_PREVIEW: (packId: string) => `content-packs/${sanitizeId(packId, "packId")}/preview.jpg`,
}

// Asset type validation
export const AssetTypes = {
  IMAGE: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  AUDIO: ["audio/mpeg", "audio/ogg"],
  TEXT: ["text/plain"],
  ARCHIVE: ["application/zip", "application/x-zip-compressed"],
}

// Asset size limits (in bytes)
export const AssetLimits = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  AUDIO: 20 * 1024 * 1024, // 20MB
  TEXT: 1 * 1024 * 1024, // 1MB
  ARCHIVE: 500 * 1024 * 1024, // 500MB
}
