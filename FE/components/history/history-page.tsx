"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Calendar, Clock, MessageCircle, Filter, Thermometer, Heart } from "lucide-react"
import { ChatModal } from "./chat-modal"
import { PartnerProfileModal } from "./partner-profile-modal"
import { Header } from "@/components/common/header"
import { BackgroundLayout } from "@/components/common/background-layout"
import { useAuth } from "@/contexts/auth-context"

interface HistoryPageProps {
  onBack?: () => void
  onHomeClick?: () => void
  onHistoryClick?: () => void
  onProfileClick?: () => void
  onMbtiClick?: () => void
  onLogout?: () => void
}

interface HistoryItem {
  id: string
  date: string
  partnerNickname: string
  duration: string
  rounds: number
  chatEnabled: boolean
  partnerTemp: number
}

const MOCK_HISTORY: HistoryItem[] = [
  {
    id: "1",
    date: "2024.01.14",
    partnerNickname: "커피러버",
    duration: "25분",
    rounds: 3,
    chatEnabled: true,
    partnerTemp: 38.2,
  },
  {
    id: "2",
    date: "2024.01.13",
    partnerNickname: "여행가",
    duration: "15분",
    rounds: 2,
    chatEnabled: false,
    partnerTemp: 35.8,
  },
  {
    id: "3",
    date: "2024.01.12",
    partnerNickname: "음악덕후",
    duration: "35분",
    rounds: 4,
    chatEnabled: true,
    partnerTemp: 39.1,
  },
  {
    id: "4",
    date: "2024.01.11",
    partnerNickname: "독서왕",
    duration: "10분",
    rounds: 2,
    chatEnabled: false,
    partnerTemp: 36.5,
  },
  {
    id: "5",
    date: "2024.01.10",
    partnerNickname: "요리사",
    duration: "45분",
    rounds: 4,
    chatEnabled: true,
    partnerTemp: 40.2,
  },
]

type FilterType = "all" | "chat-on" | "chat-off"

const getRoundHearts = (rounds: number) => {
  const maxRounds = 4;
  const fullHearts = Math.floor(rounds);
  const halfHeart = rounds % 1 !== 0;
  return (
    <div className="flex items-center">
      {Array.from({ length: fullHearts }, (_, i) => (
        <Heart key={i} className="w-4 h-4 text-red-500" />
      ))}
      {halfHeart && <Heart className="w-4 h-4 text-red-500/50" />}
    </div>
  );
};

export function HistoryPage({ 
  onBack, 
  onHomeClick, 
  onHistoryClick, 
  onProfileClick, 
  onMbtiClick, 
  onLogout 
}: HistoryPageProps) {
  const { user } = useAuth()
  const [history, setHistory] = useState<HistoryItem[]>(MOCK_HISTORY)
  const [filter, setFilter] = useState<FilterType>("all")
  const [selectedChat, setSelectedChat] = useState<HistoryItem | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<HistoryItem | null>(null)

  const handleToggleChat = (id: string) => {
    setHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, chatEnabled: !item.chatEnabled } : item))
    )
  }

  const filteredHistory = history.filter((item) => {
    if (filter === "all") return true
    if (filter === "chat-on") return item.chatEnabled
    if (filter === "chat-off") return !item.chatEnabled
    return true
  })

  const chatOnCount = history.filter((h) => h.chatEnabled).length
  const chatOffCount = history.filter((h) => !h.chatEnabled).length

  const getTemperatureColor = (temp: number) => {
    if (temp >= 40) return "text-red-500"
    if (temp >= 38) return "text-orange-500"
    if (temp >= 36) return "text-green-500"
    if (temp >= 34) return "text-blue-500"
    return "text-blue-700"
  }

  // 라운드 진행도를 하나의 하트로 표시 (색상 채워짐)
  const getRoundProgress = (rounds: number) => {
    const maxRounds = 4
    const percentage = Math.min((rounds / maxRounds) * 100, 100)
    return percentage
  }

  return (
    <BackgroundLayout>
      {/* Header */}
      {user && (
        <Header
          onHomeClick={onHomeClick || onBack}
          onHistoryClick={onHistoryClick}
          onProfileClick={onProfileClick}
          onMbtiClick={onMbtiClick}
          onLogout={onLogout}
          currentView="history"
        />
      )}

      <main className="pt-20 pb-10 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold">소개팅 이력</h1>
              <p className="text-muted-foreground text-sm">지금까지의 만남을 확인해보세요</p>
            </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
            <div className="p-3 sm:p-4 rounded-xl bg-card text-center">
              <p className="text-xl sm:text-2xl font-bold text-primary">{history.length}</p>
              <p className="text-xs text-muted-foreground">총 매칭</p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-card text-center">
              <p className="text-xl sm:text-2xl font-bold text-green-600">{chatOnCount}</p>
              <p className="text-xs text-muted-foreground">채팅 ON</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                className={filter === "all" ? "bg-primary text-primary-foreground" : ""}
              >
                전체 ({history.length})
              </Button>
              <Button
                variant={filter === "chat-on" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("chat-on")}
                className={filter === "chat-on" ? "bg-green-600 text-white hover:bg-green-700" : ""}
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                채팅 ON ({chatOnCount})
              </Button>
              <Button
                variant={filter === "chat-off" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("chat-off")}
                className={filter === "chat-off" ? "bg-muted-foreground text-white hover:bg-muted-foreground/90" : ""}
              >
                채팅 OFF ({chatOffCount})
              </Button>
            </div>
          </div>

          {/* History List */}
          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <div key={item.id} className="p-4 rounded-xl bg-card flex items-center gap-3 sm:gap-4">
                <div className="flex flex-col items-center justify-center flex-shrink-0">
                  <div className="relative w-12 h-12">
                    <Heart className="w-12 h-12 text-gray-300" />
                    <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(${100 - getRoundProgress(item.rounds)}% 0 0 0)` }}>
                      <Heart className="w-12 h-12 text-red-500 fill-red-500" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{item.rounds}/4R</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedProfile(item)}
                      className="font-semibold truncate hover:text-primary underline-offset-2 hover:underline cursor-pointer"
                    >
                      {item.partnerNickname}
                    </button>
                    <span className={`text-xs flex items-center gap-0.5 ${getTemperatureColor(item.partnerTemp)}`}>
                      <Thermometer className="w-3 h-3" />
                      {item.partnerTemp.toFixed(1)}°
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.duration}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">채팅</span>
                    <Switch
                      checked={item.chatEnabled}
                      onCheckedChange={() => handleToggleChat(item.id)}
                    />
                  </div>
                  {item.chatEnabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedChat(item)}
                      className="flex items-center gap-1 text-green-600 border-green-600 hover:bg-green-50"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">채팅</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredHistory.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {filter === "all"
                  ? "아직 소개팅 이력이 없어요."
                  : filter === "chat-on"
                    ? "아직 채팅이 활성화된 매칭이 없어요."
                    : "채팅이 비활성화된 매칭이 없어요."}
              </p>
              <p className="text-muted-foreground text-sm">첫 번째 만남을 시작해보세요!</p>
            </div>
          )}
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
      </main>
    </BackgroundLayout>
  )
}
