"use client"

import { useState, useEffect, useCallback } from "react"
import type { HistoryItem } from "@/lib/history-types"
import type { HistorySummaryData } from "@/lib/api/history"
import { getHistoryList, blockPartner as apiBlockPartner, unblockPartner as apiUnblockPartner } from "@/lib/api/history"

interface UseHistoryOptions {
  page: number
  size: number
  search?: string
}

const EMPTY_SUMMARY: HistorySummaryData = {
  totalMatches: 0,
  totalMinutes: 0,
  myClarityScore: 0,
}

export function useHistory({ page, size, search }: UseHistoryOptions) {
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
      const data = await getHistoryList(page, size, search)
      setHistory(data.items)
      setSummary(data.summary)
      setTotalPages(Math.max(1, data.totalPages))
      setTotalElements(data.totalElements)
      setBlockedIds(data.items.filter((item) => item.isBlocked).map((item) => item.id))
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)))
    } finally {
      setIsLoading(false)
    }
  }, [page, size, search])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const blockPartner = useCallback(async (localId: string, apiId?: string) => {
    const targetIds = apiId ? history.filter((item) => item.partnerId === apiId).map((item) => item.id) : [localId]
    setBlockedIds((prev) => {
      const next = new Set(prev)
      for (const id of targetIds) {
        next.add(id)
      }
      return Array.from(next)
    })
    if (!apiId) return
    try {
      await apiBlockPartner(apiId)
    } catch (error) {
      setBlockedIds((prev) => prev.filter((id) => !targetIds.includes(id)))
      throw error
    }
  }, [history])

  const unblockPartner = useCallback(async (localId: string, apiId?: string) => {
    const targetIds = apiId ? history.filter((item) => item.partnerId === apiId).map((item) => item.id) : [localId]
    setBlockedIds((prev) => prev.filter((id) => !targetIds.includes(id)))
    if (!apiId) return
    try {
      await apiUnblockPartner(apiId)
    } catch (error) {
      setBlockedIds((prev) => [...new Set([...prev, ...targetIds])])
      throw error
    }
  }, [history])

  const setItemUnreadCount = useCallback((conferenceId: string, unreadCount: number) => {
    setHistory((prev) =>
      prev.map((item) => (item.id === conferenceId ? { ...item, unreadCount } : item))
    )
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
    setItemUnreadCount,
  }
}
