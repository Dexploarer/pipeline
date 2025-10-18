import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { WorldZone } from "../npc-types"
import type { WorldRegion } from "../npc-types"
import type { ContentPack } from "../npc-types"
import type { ZoneAssignment } from "../npc-types"

interface WorldStore {
  zones: WorldZone[]
  regions: WorldRegion[]
  contentPacks: ContentPack[]
  assignments: ZoneAssignment[]

  // Zone operations
  addZone: (zone: WorldZone) => void
  updateZone: (id: string, zone: Partial<WorldZone>) => void
  deleteZone: (id: string) => void
  getZone: (id: string) => WorldZone | undefined
  getZonesByRegion: (regionId: string) => WorldZone[]

  // Region operations
  addRegion: (region: WorldRegion) => void
  updateRegion: (id: string, region: Partial<WorldRegion>) => void
  deleteRegion: (id: string) => void
  getRegion: (id: string) => WorldRegion | undefined

  // Content pack operations
  addContentPack: (pack: ContentPack) => void
  updateContentPack: (id: string, pack: Partial<ContentPack>) => void
  deleteContentPack: (id: string) => void
  getContentPack: (id: string) => ContentPack | undefined
  exportContentPack: (id: string) => ContentPack | undefined

  // Assignment operations
  assignToZone: (assignment: ZoneAssignment) => void
  unassignFromZone: (entityId: string, zoneId: string) => void
  getAssignmentsByZone: (zoneId: string) => ZoneAssignment[]
  getAssignmentsByEntity: (entityId: string) => ZoneAssignment[]
}

export const useWorldStore = create<WorldStore>()(
  persist(
    (set, get) => ({
      zones: [],
      regions: [],
      contentPacks: [],
      assignments: [],

      addZone: (zone) => set((state) => ({ zones: [...state.zones, zone] })),

      updateZone: (id, updates) =>
        set((state) => ({
          zones: state.zones.map((zone) => (zone.id === id ? { ...zone, ...updates } : zone)),
        })),

      deleteZone: (id) =>
        set((state) => ({
          zones: state.zones.filter((zone) => zone.id !== id),
          assignments: state.assignments.filter((a) => a.zoneId !== id),
        })),

      getZone: (id) => get().zones.find((zone) => zone.id === id),
      getZonesByRegion: (regionId) => get().zones.filter((zone) => zone.parentRegionId === regionId),

      addRegion: (region) => set((state) => ({ regions: [...state.regions, region] })),

      updateRegion: (id, updates) =>
        set((state) => ({
          regions: state.regions.map((region) => (region.id === id ? { ...region, ...updates } : region)),
        })),

      deleteRegion: (id) =>
        set((state) => {
          // Find all zones that will be removed
          const removedZoneIds = state.zones
            .filter((zone) => zone.parentRegionId === id)
            .map((zone) => zone.id)

          return {
            regions: state.regions.filter((region) => region.id !== id),
            zones: state.zones.filter((zone) => zone.parentRegionId !== id),
            assignments: state.assignments.filter((a) => !removedZoneIds.includes(a.zoneId)),
          }
        }),

      getRegion: (id) => get().regions.find((region) => region.id === id),

      addContentPack: (pack) => set((state) => ({ contentPacks: [...state.contentPacks, pack] })),

      updateContentPack: (id, updates) =>
        set((state) => ({
          contentPacks: state.contentPacks.map((pack) => (pack.id === id ? { ...pack, ...updates } : pack)),
        })),

      deleteContentPack: (id) =>
        set((state) => ({
          contentPacks: state.contentPacks.filter((pack) => pack.id !== id),
        })),

      getContentPack: (id) => get().contentPacks.find((pack) => pack.id === id),
      exportContentPack: (id) => get().contentPacks.find((pack) => pack.id === id),

      assignToZone: (assignment) => set((state) => ({ assignments: [...state.assignments, assignment] })),

      unassignFromZone: (entityId, zoneId) =>
        set((state) => ({
          assignments: state.assignments.filter((a) => !(a.entityId === entityId && a.zoneId === zoneId)),
        })),

      getAssignmentsByZone: (zoneId) => get().assignments.filter((a) => a.zoneId === zoneId),
      getAssignmentsByEntity: (entityId) => get().assignments.filter((a) => a.entityId === entityId),
    }),
    {
      name: "world-storage",
    },
  ),
)
