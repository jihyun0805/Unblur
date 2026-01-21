"use client"

import { useState } from "react"
import { ChatModal } from "./chat-modal"
import { PartnerProfileModal } from "./partner-profile-modal"
import { Header } from "@/components/common/header"
import { BackgroundLayout } from "@/components/common/background-layout"
import { useAuth } from "@/contexts/auth-context"
import { useHistory } from "@/hooks/use-history"
import type { HistoryItem } from "@/lib/history-types"
import { HistoryPageHeader } from "./history-page-header"
import { HistorySummary } from "./history-summary"
import { HistoryItemCard } from "./history-item-card"
import { HistoryLoading } from "./history-loading"
import { HistoryError } from "./history-error"
import { HistoryEmptyState } from "./history-empty-state"

interface HistoryPageProps {
  variant?: "standalone" | "embedded"
  onLogout?: () => void
}

export function HistoryPage({ variant = "embedded", onLogout }: HistoryPageProps) {
  const { user } = useAuth()
  const { history, isLoading, error, refetch, blockPartner, unblockPartner, blockedIds } = useHistory()

  const [selectedChat, setSelectedChat] = useState<HistoryItem | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<HistoryItem | null>(null)

  const totalDuration = (() => {
    const totalMin = history.reduce((acc, h) => {
      const m = parseInt(h.duration.replace(/\D/g, ""), 10) || 0
      return acc + (h.duration.includes("시간") ? m * 60 : m)
    }, 0)
    if (totalMin >= 60) return `${(totalMin / 60).toFixed(1)}h`
    return `${totalMin}분`
  })()

  const content = (
    <>
      <div className="max-w-3xl mx-auto">
        <HistoryPageHeader />
        <HistorySummary
          totalCount={history.length}
          totalDuration={totalDuration}
          temperature={user?.temperature ?? 36.5}
        />

        {isLoading && <HistoryLoading />}
        {!isLoading && error && <HistoryError onRetry={refetch} />}
        {!isLoading && !error && (
          <div className="space-y-3">
            {history.map((item) => (
              <HistoryItemCard
                key={item.id}
                item={item}
                onProfileClick={setSelectedProfile}
                onChatClick={setSelectedChat}
                onBlock={blockPartner}
                onUnblock={unblockPartner}
                isBlocked={blockedIds.includes(item.id)}
              />
            ))}
            {history.length === 0 && <HistoryEmptyState />}
          </div>
        )}
      </div>

      {selectedChat && (
        <ChatModal
          open={!!selectedChat}
          onOpenChange={(open) => !open && setSelectedChat(null)}
          partner={selectedChat}
          isBlocked={blockedIds.includes(selectedChat.id)}
        />
      )}

      {selectedProfile && (
        <PartnerProfileModal
          open={!!selectedProfile}
          onOpenChange={(open) => !open && setSelectedProfile(null)}
          partner={selectedProfile}
        />
      )}
    </>
  )

  if (variant === "standalone") {
    return (
      <BackgroundLayout>
        {user && <Header onLogout={onLogout} />}
        <main className="pt-20 pb-10 px-4">
          {content}
        </main>
      </BackgroundLayout>
    )
  }

  return content
}
