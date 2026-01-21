"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Mic, MicOff, PhoneOff, MessageCircle, Gamepad2, Send, Clock, X, Lightbulb } from "lucide-react"
import { BalanceGameOverlay } from "@/components/session/balance-game-overlay"
import { RoundVoteModal } from "@/components/session/round-vote-modal"
import { RatingModal } from "@/components/session/rating-modal"
import { ConfirmLeaveModal } from "@/components/session/confirm-leave-modal"
import { EndCallConfirmModal } from "@/components/session/end-call-confirm-modal"

interface SessionRoomProps {
  sessionId: string
  onLeave: () => void
}

const ROUND_TIMES = [10, 10, 5, Number.POSITIVE_INFINITY] // seconds
const BLUR_LEVELS = [20, 10, 3, 0] // px
const ROUND_NAMES = ["1라운드", "2라운드", "3라운드", "최종 라운드"]

const ICE_BREAKERS = [
  "요즘 빠져있는 취미가 있어요?",
  "가장 최근에 본 영화나 드라마는 뭐예요?",
  "주말에는 보통 뭐 하세요?",
  "여행 가고 싶은 나라가 있어요?",
  "좋아하는 음식이 뭐예요?",
]

export function SessionRoom({ sessionId, onLeave }: SessionRoomProps) {
  const [currentRound, setCurrentRound] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_TIMES[0])
  const [isMuted, setIsMuted] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showGame, setShowGame] = useState(false)
  const [showVote, setShowVote] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [showConfirmLeave, setShowConfirmLeave] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [pendingLeave, setPendingLeave] = useState(false)
  const [messages, setMessages] = useState<{ id: string; sender: string; text: string }[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [showIceBreaker, setShowIceBreaker] = useState(false)
  const [currentIceBreaker, setCurrentIceBreaker] = useState("")
  const [silenceTimer, setSilenceTimer] = useState(0)
  const { toast } = useToast()
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Timer logic
  useEffect(() => {
    if (currentRound >= 3 || showVote || showGame || showRating || showConfirmLeave || showEndConfirm) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setShowVote(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [currentRound, showVote, showGame, showRating, showConfirmLeave, showEndConfirm])

  // Silence detection - 5초 이상 정적 시 질문 카드 표시
  useEffect(() => {
    const interval = setInterval(() => {
      setSilenceTimer((prev) => {
        if (prev >= 5 && !showIceBreaker) {
          const randomQuestion = ICE_BREAKERS[Math.floor(Math.random() * ICE_BREAKERS.length)]
          setCurrentIceBreaker(randomQuestion)
          setShowIceBreaker(true)
          return 0
        }
        return prev + 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [showIceBreaker])

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const formatTime = (seconds: number) => {
    if (seconds === Number.POSITIVE_INFINITY) return "∞"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "me",
        text: newMessage,
      },
    ])
    setNewMessage("")
    setSilenceTimer(0)

    // Simulate partner response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "partner",
          text: "네, 맞아요! 저도 그렇게 생각해요 :)",
        },
      ])
    }, 2000)
  }

  const handleVoteResult = (continued: boolean, partnerWantsContinue: boolean) => {
    setShowVote(false)

    if (continued) {
      setCurrentRound((prev) => Math.min(prev + 1, 3))
      setTimeLeft(ROUND_TIMES[Math.min(currentRound + 1, 3)])
      toast({
        title: `${ROUND_NAMES[currentRound + 1]} 시작!`,
        description: currentRound + 1 === 3 ? "최종 라운드입니다. 제한 없이 대화하세요!" : "대화를 계속해보세요.",
      })
    } else if (partnerWantsContinue) {
      // 상대방은 계속하고 싶은데 내가 나가려고 함 -> 재확인 모달
      setPendingLeave(true)
      setShowConfirmLeave(true)
    } else {
      // 둘 다 종료 원함 -> 평가 모달로 이동
      setShowRating(true)
    }
  }

  const handleConfirmLeave = () => {
    setShowConfirmLeave(false)
    setPendingLeave(false)
    setShowRating(true)
  }

  const handleContinueAfterConfirm = () => {
    setShowConfirmLeave(false)
    setPendingLeave(false)
    setCurrentRound((prev) => Math.min(prev + 1, 3))
    setTimeLeft(ROUND_TIMES[Math.min(currentRound + 1, 3)])
    toast({
      title: `${ROUND_NAMES[currentRound + 1]} 시작!`,
      description: "대화를 계속해보세요!",
    })
  }

  const handleRatingComplete = () => {
    setShowRating(false)
    toast({
      title: "소개팅 종료",
      description: "다음에 더 좋은 인연을 만나길 바랍니다!",
    })
    onLeave()
  }

  const handleLeave = () => {
    setShowEndConfirm(true)
  }

  const blurLevel = BLUR_LEVELS[currentRound]
  const isTimeWarning = timeLeft <= 60 && timeLeft > 0

  return (
    <div className="fixed inset-0 bg-[#1a1a1a] flex flex-col">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm">
            <Clock className="w-4 h-4 text-white" />
            <span className="text-white font-medium">{ROUND_NAMES[currentRound]}</span>
            <span
              className={`text-lg font-mono font-bold ${isTimeWarning ? "text-red-400 animate-pulse" : "text-white"}`}
            >
              {formatTime(timeLeft)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className={`ml-1 h-8 w-8 rounded-full ${
                isMuted ? "bg-red-500 hover:bg-red-600" : "bg-white/20 hover:bg-white/30"
              }`}
            >
              {isMuted ? <MicOff className="h-4 w-4 text-white" /> : <Mic className="h-4 w-4 text-white" />}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGame(true)}
              className="text-white hover:bg-white/20"
            >
              <Gamepad2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChat(!showChat)}
              className="text-white hover:bg-white/20"
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Video Grid - 양쪽 모두 블러 처리 */}
      <div className="flex-1 p-4 pt-20 pb-24">
        <div className="h-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Partner Video - 블러 적용 */}
          <div className="relative rounded-2xl overflow-hidden bg-[#2a2a2a]">
            <div
              className="absolute inset-0 flex items-center justify-center transition-all duration-1000"
              style={{ filter: `blur(${blurLevel}px)` }}
            >
              <div className="w-32 h-32 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-4xl">👤</span>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
              <span className="text-white text-sm">상대방</span>
            </div>
            {blurLevel > 0 && (
              <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-primary/80 backdrop-blur-sm">
                <span className="text-primary-foreground text-xs">블러 {blurLevel}px</span>
              </div>
            )}
          </div>

          {/* My Video - 나도 블러 적용 */}
          <div className="relative rounded-2xl overflow-hidden bg-[#2a2a2a]">
            <div
              className="absolute inset-0 flex items-center justify-center transition-all duration-1000"
              style={{ filter: `blur(${blurLevel}px)` }}
            >
              <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center">
                <span className="text-4xl">😊</span>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
              <span className="text-white text-sm">나</span>
            </div>
            {blurLevel > 0 && (
              <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-primary/80 backdrop-blur-sm">
                <span className="text-primary-foreground text-xs">블러 {blurLevel}px</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ice Breaker Toast */}
      {showIceBreaker && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card shadow-lg max-w-md">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">이런 질문은 어때요?</p>
              <p className="text-sm font-medium">{currentIceBreaker}</p>
            </div>
            <button onClick={() => setShowIceBreaker(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Chat Panel */}
      {showChat && (
        <div className="absolute right-4 bottom-28 top-20 w-80 bg-background rounded-2xl shadow-xl flex flex-col overflow-hidden z-20">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">채팅</h3>
            <button onClick={() => setShowChat(false)}>
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                    msg.sender === "me" ? "bg-primary text-primary-foreground" : "bg-card"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 border-t border-border">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex gap-2"
            >
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="메시지를 입력하세요..."
                className="bg-input"
              />
              <Button type="submit" size="icon" className="bg-primary text-primary-foreground">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {currentRound >= 3 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLeave}
          className="absolute bottom-6 right-36 z-20 h-11 w-11 rounded-full bg-red-500 hover:bg-red-600"
        >
          <PhoneOff className="h-5 w-5 text-white" />
        </Button>
      )}

      {/* Game Overlay */}
      {showGame && <BalanceGameOverlay onClose={() => setShowGame(false)} />}

      {/* Round Vote Modal */}
      <RoundVoteModal open={showVote} currentRound={currentRound} onResult={handleVoteResult} />

      <ConfirmLeaveModal
        open={showConfirmLeave}
        onConfirmLeave={handleConfirmLeave}
        onContinue={handleContinueAfterConfirm}
      />

      <EndCallConfirmModal
        open={showEndConfirm}
        onCancel={() => setShowEndConfirm(false)}
        onConfirm={() => {
          setShowEndConfirm(false)
          setShowRating(true)
        }}
      />

      <RatingModal open={showRating} onComplete={handleRatingComplete} partnerNickname="상대방" />
    </div>
  )
}
