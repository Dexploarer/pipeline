import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Relationship {
  id: string
  from: string
  to: string
  type: "ally" | "rival" | "neutral" | "enemy" | "family" | "romantic" | "mentor"
  strength: number
  description: string
}

interface RelationshipStore {
  relationships: Relationship[]
  addRelationship: (relationship: Relationship) => void
  updateRelationship: (id: string, relationship: Partial<Relationship>) => void
  deleteRelationship: (id: string) => void
  getRelationship: (id: string) => Relationship | undefined
  getRelationshipsByEntity: (entityName: string) => Relationship[]
}

export const useRelationshipStore = create<RelationshipStore>()(
  persist(
    (set, get) => ({
      relationships: [],

      addRelationship: (relationship) => set((state) => ({ relationships: [...state.relationships, relationship] })),

      updateRelationship: (id, updates) =>
        set((state) => ({
          relationships: state.relationships.map((rel) => (rel.id === id ? { ...rel, ...updates } : rel)),
        })),

      deleteRelationship: (id) =>
        set((state) => ({ relationships: state.relationships.filter((rel) => rel.id !== id) })),

      getRelationship: (id) => get().relationships.find((rel) => rel.id === id),

      getRelationshipsByEntity: (entityName) =>
        get().relationships.filter((rel) => rel.from === entityName || rel.to === entityName),
    }),
    {
      name: "relationship-storage",
    },
  ),
)
