"use client"

import { useState, useEffect, useCallback } from "react"
import type { HistoryItem } from "@/lib/history-types"
import type { HistorySummaryData } from "@/lib/api/history"
import { getHistoryList, blockPartner as apiBlockPartner, unblockPartner as apiUnblockPartner } from "@/lib/api/history"

interface UseHistoryOptions {
  page: number
  size: number
}

const EMPTY_SUMMARY: HistorySummaryData = {
  totalMatches: 0,
  totalMinutes: 0,
  myClarityScore: 0,
}

export function useHistory({ page, size }: UseHistoryOptions) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [summary, setSummary] = useState<HistorySummaryData>(EMPTY_SUMMARY)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [blockedIds, setBlockedIds] = useState<string[]>([])

  const fetchHistory = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getHistoryList(page, size)
      setHistory(data.items)
      setSummary(data.summary)
      setTotalPages(Math.max(1, data.totalPages))
      setTotalElements(data.totalElements)
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)))
    } finally {
      setIsLoading(false)
    }
  }, [page, size])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const blockPartner = useCallback(async (localId: string, apiId?: string) => {
    setBlockedIds((prev) => (prev.includes(localId) ? prev : [...prev, localId]))
    if (!apiId) return
    try {
      await apiBlockPartner(apiId)
    } catch (error) {
      console.error("[useHistory] 차단 요청 실패", error)
    }
  }, [])

  const unblockPartner = useCallback(async (localId: string, apiId?: string) => {
    setBlockedIds((prev) => prev.filter((b) => b !== localId))
    if (!apiId) return
    try {
      await apiUnblockPartner(apiId)
    } catch (error) {
      console.error("[useHistory] 차단 해제 요청 실패", error)
    }
  }, [])

  return {
    history,
    summary,
    totalPages,
    totalElements,
    isLoading,
    error,
    refetch: fetchHistory,
    blockPartner,
    unblockPartner,
    blockedIds,
  }
}
