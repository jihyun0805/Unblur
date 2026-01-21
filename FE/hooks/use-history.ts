"use client"

import { useState, useEffect, useCallback } from "react"
import type { HistoryItem } from "@/lib/history-types"
import { getHistoryList, blockPartner as apiBlockPartner, unblockPartner as apiUnblockPartner } from "@/lib/api/history"

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [blockedIds, setBlockedIds] = useState<string[]>([])

  const fetchHistory = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getHistoryList()
      setHistory(data)
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const blockPartner = useCallback(async (id: string) => {
    await apiBlockPartner(id)
    setBlockedIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  const unblockPartner = useCallback(async (id: string) => {
    await apiUnblockPartner(id)
    setBlockedIds((prev) => prev.filter((b) => b !== id))
  }, [])

  return {
    history,
    isLoading,
    error,
    refetch: fetchHistory,
    blockPartner,
    unblockPartner,
    blockedIds,
  }
}
