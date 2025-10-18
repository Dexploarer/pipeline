import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { DialogueNode } from "../npc-types"

interface DialogueTree {
  id: string
  name: string
  nodes: DialogueNode[]
  createdAt: string
}

interface DialogueStore {
  trees: DialogueTree[]
  addTree: (tree: DialogueTree) => void
  updateTree: (id: string, tree: Partial<DialogueTree>) => void
  deleteTree: (id: string) => void
  getTree: (id: string) => DialogueTree | undefined
  addNodeToTree: (treeId: string, node: DialogueNode) => void
  updateNodeInTree: (treeId: string, nodeId: string, updates: Partial<DialogueNode>) => void
  deleteNodeFromTree: (treeId: string, nodeId: string) => void
}

export const useDialogueStore = create<DialogueStore>()(
  persist(
    (set, get) => ({
      trees: [],

      addTree: (tree) => set((state) => ({ trees: [...state.trees, tree] })),

      updateTree: (id, updates) =>
        set((state) => ({
          trees: state.trees.map((tree) => (tree.id === id ? { ...tree, ...updates } : tree)),
        })),

      deleteTree: (id) => set((state) => ({ trees: state.trees.filter((tree) => tree.id !== id) })),

      getTree: (id) => get().trees.find((tree) => tree.id === id),

      addNodeToTree: (treeId, node) =>
        set((state) => ({
          trees: state.trees.map((tree) => (tree.id === treeId ? { ...tree, nodes: [...tree.nodes, node] } : tree)),
        })),

      updateNodeInTree: (treeId, nodeId, updates) =>
        set((state) => ({
          trees: state.trees.map((tree) =>
            tree.id === treeId
              ? {
                  ...tree,
                  nodes: tree.nodes.map((node) => (node.id === nodeId ? { ...node, ...updates } : node)),
                }
              : tree,
          ),
        })),

      deleteNodeFromTree: (treeId, nodeId) =>
        set((state) => ({
          trees: state.trees.map((tree) =>
            tree.id === treeId
              ? {
                  ...tree,
                  nodes: tree.nodes.filter((node) => node.id !== nodeId),
                }
              : tree,
          ),
        })),
    }),
    {
      name: "dialogue-storage",
    },
  ),
)
