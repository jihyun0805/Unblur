"use client"

import { useState } from "react"
import { ChatModal } from "./chat-modal"
import { PartnerProfileModal } from "./partner-profile-modal"
import { useAuth } from "@/contexts/auth-context"
import { useHistory } from "@/hooks/use-history"
import type { HistoryItem } from "@/lib/history-types"
import { HistoryPageHeader } from "./history-page-header"
import { HistorySummary } from "./history-summary"
import { HistoryItemCard } from "./history-item-card"
import { HistoryEmptyState } from "./history-empty-state"
import { HistoryLoading } from "./history-loading"
import { HistoryError } from "./history-error"

export function HistoryPage() {
  const { user } = useAuth()
  const { history, isLoading, error, refetch, blockPartner, blockedIds } = useHistory()
  const [selectedChat, setSelectedChat] = useState<HistoryItem | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<HistoryItem | null>(null)

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <HistoryLoading />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <HistoryError onRetry={refetch} />
      </div>
    )
  }

  return (
    <>
      <div className="max-w-3xl mx-auto">
        <HistoryPageHeader />
        <HistorySummary
          totalCount={history.length}
          totalDuration="-"
          temperature={user?.temperature ?? 36.5}
        />

        <div className="space-y-3">
          {history.map((item) => (
            <HistoryItemCard
              key={item.id}
              item={item}
              onProfileClick={setSelectedProfile}
              onChatClick={setSelectedChat}
              onBlock={blockPartner}
              isBlocked={blockedIds.includes(item.id)}
            />
          ))}
        </div>

        {history.length === 0 && <HistoryEmptyState />}
      </div>

      {selectedChat && (
        <ChatModal
          open={!!selectedChat}
          onOpenChange={(open) => !open && setSelectedChat(null)}
          partner={selectedChat}
        />
      )}

      {selectedProfile && (
        <PartnerProfileModal
          open={!!selectedProfile}
          onOpenChange={(open) => !open && setSelectedProfile(null)}
          partner={{
            nickname: selectedProfile.partnerNickname,
            partnerTemp: selectedProfile.partnerTemp,
            date: selectedProfile.date,
            duration: selectedProfile.duration,
            rounds: selectedProfile.rounds,
            chatEnabled: selectedProfile.chatEnabled,
          }}
        />
      )}
    </>
  )
}
