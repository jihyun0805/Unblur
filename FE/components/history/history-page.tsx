"use client"

import { useEffect, useMemo, useState } from "react"
import { ChatModal } from "./chat-modal"
import { UserProfileModal } from "@/components/common/user-profile-modal"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useAuth } from "@/contexts/auth-context"
import { useHistory } from "@/hooks/use-history"
import { getPartnerProfile } from "@/lib/api/history"
import type { HistoryItem } from "@/lib/history-types"
import { HistoryPageHeader } from "./history-page-header"
import { HistorySummary } from "./history-summary"
import { HistoryItemCard } from "./history-item-card"
import { HistoryEmptyState } from "./history-empty-state"
import { HistoryLoading } from "./history-loading"
import { HistoryError } from "./history-error"
import { Search } from "lucide-react"

const formatDuration = (minutes: number): string => {
  if (!Number.isFinite(minutes)) return "-"
  if (minutes < 60) return `${minutes}분`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (rest === 0) return `${hours}시간`
  return `${hours}시간 ${rest}분`
}

const REGION_CODE_TO_LABEL: Record<string, string> = {
  SEOUL: "서울",
  GYEONGGI: "경기",
  INCHEON: "인천",
  BUSAN: "부산",
  DAEGU: "대구",
  DAEJEON: "대전",
  GWANGJU: "광주",
  ULSAN: "울산",
  SEJONG: "세종",
  GANGWON: "강원",
  CHUNGBUK: "충북",
  CHUNGNAM: "충남",
  JEONBUK: "전북",
  JEONNAM: "전남",
  GYEONGBUK: "경북",
  GYEONGNAM: "경남",
  JEJU: "제주",
}

const mapGender = (value?: string | null): string | undefined => {
  if (value === "MALE") return "male"
  if (value === "FEMALE") return "female"
  return undefined
}

const mapRegion = (value?: string | null): string | undefined => {
  if (!value) return undefined
  return REGION_CODE_TO_LABEL[value] ?? value
}

export function HistoryPage() {
  const { user } = useAuth()
  const pageSize = 5
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedChat, setSelectedChat] = useState<HistoryItem | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<HistoryItem | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const { history, summary, totalPages, isLoading, error, refetch, blockPartner, unblockPartner, blockedIds } =
    useHistory({ page: currentPage - 1, size: pageSize, search: debouncedSearch })

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      const aBlocked = blockedIds.includes(a.id)
      const bBlocked = blockedIds.includes(b.id)
      if (aBlocked === bBlocked) return 0
      return aBlocked ? 1 : -1
    })
  }, [history, blockedIds])

  const handleProfileClick = async (item: HistoryItem) => {
    setSelectedProfile(item)
    setIsProfileLoading(true)
    try {
      const profile = await getPartnerProfile(item.id)
      setSelectedProfile((prev) => {
        if (!prev || prev.id !== item.id) return prev
        return {
          ...prev,
          partnerNickname: profile.nickname ?? prev.partnerNickname,
          partnerTemp: profile.clarityScore ?? prev.partnerTemp,
          age: profile.age ?? prev.age,
          gender: mapGender(profile.gender) ?? prev.gender,
          region: mapRegion(profile.region) ?? prev.region,
          bio: profile.intro ?? prev.bio,
          mbti: profile.mbti ?? prev.mbti,
          interests: profile.interestTags ?? prev.interests,
          roundSummaries: profile.roundSummaries?.map((round) => round.summaryText) ?? prev.roundSummaries,
        }
      })
    } catch (profileError) {
      console.error("[HistoryPage] 프로필 조회 실패", profileError)
    } finally {
      setIsProfileLoading(false)
    }
  }

  const safePage = Math.min(currentPage, totalPages)
  const pagedHistory = sortedHistory

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <HistoryLoading />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <HistoryError onRetry={refetch} />
      </div>
    )
  }

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <HistoryPageHeader />
        <HistorySummary
          totalCount={summary.totalMatches}
          totalDuration={formatDuration(summary.totalMinutes)}
          temperature={summary.myClarityScore ?? user?.temperature ?? 50}
        />

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="닉네임 검색"
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 gap-3">
          {pagedHistory.map((item) => (
            <HistoryItemCard
              key={item.id}
              item={item}
              onProfileClick={handleProfileClick}
              onChatClick={setSelectedChat}
              onBlock={(target) => blockPartner(target.id, target.partnerId)}
              onUnblock={(target) => unblockPartner(target.id, target.partnerId)}
              isBlocked={blockedIds.includes(item.id)}
            />
          ))}
        </div>

        {history.length === 0 && !searchTerm && <HistoryEmptyState />}
        {history.length === 0 && searchTerm && (
          <div className="py-8 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</div>
        )}
        {totalPages > 1 && (
          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  className={safePage === 1 ? "pointer-events-none opacity-50" : undefined}
                  onClick={(event) => {
                    event.preventDefault()
                    if (safePage > 1) setCurrentPage(safePage - 1)
                  }}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, index) => {
                const page = index + 1
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={page === safePage}
                      onClick={(event) => {
                        event.preventDefault()
                        setCurrentPage(page)
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  className={safePage === totalPages ? "pointer-events-none opacity-50" : undefined}
                  onClick={(event) => {
                    event.preventDefault()
                    if (safePage < totalPages) setCurrentPage(safePage + 1)
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
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
        <UserProfileModal
          open={!!selectedProfile}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedProfile(null)
              setIsProfileLoading(false)
            }
          }}
          profile={{
            nickname: selectedProfile.partnerNickname,
            temperature: selectedProfile.partnerTemp,
            age: selectedProfile.age,
            gender: selectedProfile.gender,
            region: selectedProfile.region,
            bio: selectedProfile.bio,
            mbti: selectedProfile.mbti,
            interests: selectedProfile.interests,
            roundSummaries: selectedProfile.roundSummaries,
          }}
          isLoading={isProfileLoading}
        />
      )}
    </>
  )
}
