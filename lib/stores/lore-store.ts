import { create } from "zustand"
import { persist } from "zustand/middleware"

interface LoreEntry {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  relatedEntries: string[]
  createdAt: string
}

interface LoreStore {
  loreEntries: LoreEntry[]
  addEntry: (entry: LoreEntry) => void
  updateEntry: (id: string, entry: Partial<LoreEntry>) => void
  deleteEntry: (id: string) => void
  getEntry: (id: string) => LoreEntry | undefined
  getEntriesByTag: (tag: string) => LoreEntry[]
}

export const useLoreStore = create<LoreStore>()(
  persist(
    (set, get) => ({
      loreEntries: [],

      addEntry: (entry) => set((state) => ({ loreEntries: [...state.loreEntries, entry] })),

      updateEntry: (id, updates) =>
        set((state) => ({
          loreEntries: state.loreEntries.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry)),
        })),

      deleteEntry: (id) => set((state) => ({ loreEntries: state.loreEntries.filter((entry) => entry.id !== id) })),

      getEntry: (id) => get().loreEntries.find((entry) => entry.id === id),

      getEntriesByTag: (tag) => get().loreEntries.filter((entry) => entry.tags.includes(tag)),
    }),
    {
      name: "lore-storage",
    },
  ),
)
