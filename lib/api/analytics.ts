import { api } from "@/lib/axios"
import { BehaviorTracker, type BehaviorSummary } from "@/lib/behavior-tracker"

export type BehaviorSummaryPayload = BehaviorSummary & { user_id?: number | null }

class AnalyticsService {
  async syncBehaviorSummary(summary: BehaviorSummaryPayload): Promise<{ success: boolean }> {
    try {
      await api.post(`/v1/analytics/behavior`, summary)
      return { success: true }
    } catch (e) {
      // No bloquear flujo de UI por fallos de red
      return { success: false }
    }
  }

  buildBehaviorSummary(userId?: number | null): BehaviorSummaryPayload {
    const base = BehaviorTracker.getInstance().getAggregatedSummary()
    return {
      ...base,
      user_id: userId ?? null,
    }
  }
}

export const analyticsService = new AnalyticsService()

// Utilidad para enviar resumen cuando el usuario oculta la pestaña o cierra
export function flushOnVisibilityChange(getSummary: () => BehaviorSummaryPayload | null): void {
  if (typeof window === "undefined") return

  let flushing = false
  const flush = async () => {
    if (flushing) return
    flushing = true
    try {
      const summary = getSummary()
      if (summary) {
        await analyticsService.syncBehaviorSummary(summary)
      }
    } finally {
      flushing = false
    }
  }

  const visHandler = () => {
    if (document.visibilityState === "hidden") {
      void flush()
    }
  }

  const unloadHandler = () => {
    void flush()
  }

  document.addEventListener("visibilitychange", visHandler)
  window.addEventListener("beforeunload", unloadHandler)
}