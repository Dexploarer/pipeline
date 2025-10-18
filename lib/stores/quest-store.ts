import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { LayeredQuest } from "../npc-types"

interface QuestStore {
  quests: LayeredQuest[]
  addQuest: (quest: LayeredQuest) => void
  updateQuest: (id: string, quest: Partial<LayeredQuest>) => void
  deleteQuest: (id: string) => void
  getQuest: (id: string) => LayeredQuest | undefined
}

export const useQuestStore = create<QuestStore>()(
  persist(
    (set, get) => ({
      quests: [],

      addQuest: (quest) => set((state) => ({ quests: [...state.quests, quest] })),

      updateQuest: (id, updates) =>
        set((state) => ({
          quests: state.quests.map((quest) => (quest.id === id ? { ...quest, ...updates } : quest)),
        })),

      deleteQuest: (id) => set((state) => ({ quests: state.quests.filter((quest) => quest.id !== id) })),

      getQuest: (id) => get().quests.find((quest) => quest.id === id),
    }),
    {
      name: "quest-storage",
    },
  ),
)
