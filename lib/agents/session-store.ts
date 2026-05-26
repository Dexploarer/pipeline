import type { EventDrivenAgentEngine } from './event-driven-engine'

interface SessionEntry {
  engine: EventDrivenAgentEngine
  createdAt: number
  lastAccessedAt: number
}

const MAX_SESSIONS = 100
const SESSION_TTL_MS = 30 * 60 * 1000 // 30 minutes

class SessionStore {
  private sessions = new Map<string, SessionEntry>()

  get(sessionId: string): EventDrivenAgentEngine | undefined {
    this.cleanup()
    const entry = this.sessions.get(sessionId)
    if (!entry) return undefined
    if (Date.now() - entry.lastAccessedAt > SESSION_TTL_MS) {
      this.sessions.delete(sessionId)
      return undefined
    }
    entry.lastAccessedAt = Date.now()
    return entry.engine
  }

  set(sessionId: string, engine: EventDrivenAgentEngine): void {
    this.cleanup()
    if (this.sessions.size >= MAX_SESSIONS && !this.sessions.has(sessionId)) {
      this.evictOldest()
    }
    this.sessions.set(sessionId, {
      engine,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
    })
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId)
  }

  has(sessionId: string): boolean {
    const engine = this.get(sessionId) // This also checks TTL
    return engine !== undefined
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [id, entry] of this.sessions) {
      if (now - entry.lastAccessedAt > SESSION_TTL_MS) {
        this.sessions.delete(id)
      }
    }
  }

  private evictOldest(): void {
    let oldestId: string | null = null
    let oldestTime = Infinity
    for (const [id, entry] of this.sessions) {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt
        oldestId = id
      }
    }
    if (oldestId) {
      this.sessions.delete(oldestId)
    }
  }
}

// Singleton instance stored on globalThis for serverless persistence
declare global {
  var _sessionStore: SessionStore | undefined
}

export const sessionStore: SessionStore = globalThis._sessionStore || new SessionStore()
if (!globalThis._sessionStore) {
  globalThis._sessionStore = sessionStore
}
