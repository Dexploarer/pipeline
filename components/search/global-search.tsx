"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { searchNPCs } from "@/lib/search/api"
import type { NPC } from "@/lib/npc-types"
import { useDebounce } from "@/hooks/use-debounce"

export function GlobalSearch(): React.ReactElement {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<NPC[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function performSearch(): Promise<void> {
      if (!debouncedQuery.trim()) {
        setResults([])
        setShowResults(false)
        return
      }

      setIsSearching(true)
      try {
        const response = await searchNPCs({ query: debouncedQuery, limit: 10 })
        setResults(response.results.map((r) => r.data))
        setShowResults(true)
      } catch (error) {
        console.error("[v0] Search failed:", error)
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }

    void performSearch()
  }, [debouncedQuery])

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (searchRef.current !== null && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search NPCs, quests, lore..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 0 && setShowResults(true)}
          className="pl-9 pr-9"
        />
        {isSearching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full z-50 mt-2 w-full rounded-lg border bg-popover p-2 shadow-lg">
          <div className="space-y-1">
            {results.map((npc) => (
              <button
                key={npc.id}
                className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => {
                  setShowResults(false)
                  setQuery("")
                }}
              >
                <div className="font-medium">{npc.name}</div>
                <div className="text-xs text-muted-foreground">{npc.archetype}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {showResults && !isSearching && query.length > 0 && results.length === 0 && (
        <div className="absolute top-full z-50 mt-2 w-full rounded-lg border bg-popover p-4 text-center text-sm text-muted-foreground shadow-lg">
          No results found
        </div>
      )}
    </div>
  )
}
