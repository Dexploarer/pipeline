import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { NPCScript } from "../npc-types"

interface NPCStore {
  npcs: NPCScript[]
  addNPC: (npc: NPCScript) => void
  updateNPC: (id: string, npc: Partial<NPCScript>) => void
  deleteNPC: (id: string) => void
  getNPC: (id: string) => NPCScript | undefined
}

export const useNPCStore = create<NPCStore>()(
  persist(
    (set, get) => ({
      npcs: [],

      addNPC: (npc) => set((state) => ({ npcs: [...state.npcs, npc] })),

      updateNPC: (id, updates) =>
        set((state) => ({
          npcs: state.npcs.map((npc) => (npc.id === id ? { ...npc, ...updates } : npc)),
        })),

      deleteNPC: (id) => set((state) => ({ npcs: state.npcs.filter((npc) => npc.id !== id) })),

      getNPC: (id) => get().npcs.find((npc) => npc.id === id),
    }),
    {
      name: "npc-storage",
    },
  ),
)
