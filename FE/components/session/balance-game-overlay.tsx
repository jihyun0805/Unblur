"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { WebRTCSignalingClient, SignalingMessage } from "@/lib/webrtc-signaling"

interface BalanceGameOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId: string
  userId: string
  signalingClient: WebRTCSignalingClient | null
}

const TIME_LIMIT_SECONDS = 10
const START_LIMIT_SECONDS = 10

type GameState = "idle" | "inviting" | "starting" | "started" | "result"

export function BalanceGameOverlay({
  open,
  onOpenChange,
  sessionId,
  userId,
  signalingClient,
}: BalanceGameOverlayProps) {
  const { toast } = useToast()
  const [gameState, setGameState] = useState<GameState>("idle")
  const [currentQuestion, setCurrentQuestion] = useState<{
    questionId: string
    category: string
    question: string
    optionA: string
    optionB: string
  } | null>(null)
  const [pendingChoice, setPendingChoice] = useState<"A" | "B" | null>(null)
  const [myChoice, setMyChoice] = useState<"A" | "B" | "NONE" | null>(null)
  const [partnerChoice, setPartnerChoice] = useState<"A" | "B" | "NONE" | null>(null)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS)
  const [startTimeLeft, setStartTimeLeft] = useState(START_LIMIT_SECONDS)
  const [sameChoice, setSameChoice] = useState<boolean | null>(null)

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const myChoiceRef = useRef<"A" | "B" | "NONE" | null>(null)
  const partnerChoiceRef = useRef<"A" | "B" | "NONE" | null>(null)
  const gameStateRef = useRef<GameState>(gameState)
  const selectionStartTimeRef = useRef<number | null>(null)
  const selectionSentRef = useRef<boolean>(false)

  useEffect(() => {
    myChoiceRef.current = myChoice
  }, [myChoice])

  useEffect(() => {
    partnerChoiceRef.current = partnerChoice
  }, [partnerChoice])

  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  useEffect(() => {
    gameStateRef.current = gameState
  }, [gameState])

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current)
      startTimeoutRef.current = null
    }
    if (startIntervalRef.current) {
      clearInterval(startIntervalRef.current)
      startIntervalRef.current = null
    }
  }, [])

  const displayResult = useCallback(
    (resultData: {
      questionId: string
      category: string
      question: string
      optionA: string
      optionB: string
      sameChoice: boolean
      selections: Array<{ userId: string; choice: string }>
    }) => {
      setGameState("result")
      setPendingChoice(null)
      setCurrentQuestion({
        questionId: resultData.questionId,
        category: resultData.category,
        question: resultData.question,
        optionA: resultData.optionA,
        optionB: resultData.optionB,
      })
      setSameChoice(resultData.sameChoice)

      // 선택 결과 파싱
      const mySelection = resultData.selections.find((s) => s.userId === userId)
      const partnerSelection = resultData.selections.find((s) => s.userId !== userId)

      if (mySelection) {
        const choice = mySelection.choice === "OPTION_A" ? "A" : mySelection.choice === "OPTION_B" ? "B" : "NONE"
        setMyChoice(choice)
      }

      if (partnerSelection) {
        const choice =
          partnerSelection.choice === "OPTION_A" ? "A" : partnerSelection.choice === "OPTION_B" ? "B" : "NONE"
        setPartnerChoice(choice)
      }

      clearTimers()
    },
    [userId, clearTimers]
  )

  // Dialog가 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      setGameState("idle")
      setCurrentQuestion(null)
      setPendingChoice(null)
      setMyChoice(null)
      setPartnerChoice(null)
      setSameChoice(null)
      selectionStartTimeRef.current = null
      selectionSentRef.current = false
      clearTimers()
    }
  }, [open, clearTimers])

  // WebSocket 메시지 수신 처리
  useEffect(() => {
    if (!signalingClient || !open) return

    const handleMessage = (message: SignalingMessage) => {
      if ("sessionId" in message && message.sessionId !== sessionId) return

      switch (message.type) {
        case "balance-declined":
          // 상대방이 거절함 - 초대 대기 상태 종료
          console.log("[BalanceGame] 거절 메시지 수신, 현재 상태:", gameStateRef.current)
          if (gameStateRef.current === "inviting") {
            setGameState("idle")
            clearTimers()
            toast({
              title: "게임 초대 거절",
              description: "상대가 거절했습니다.",
              variant: "default",
            })
            // 약간의 딜레이 후 Dialog 닫기 (toast가 보이도록)
            setTimeout(() => {
              onOpenChange(false)
            }, 500)
          }
          break

        case "balance-start":
          // 게임 시작
          setGameState("started")
          setCurrentQuestion({
            questionId: message.questionId,
            category: message.category,
            question: message.question,
            optionA: message.optionA,
            optionB: message.optionB,
          })
          setPendingChoice(null)
          setMyChoice(null)
          setPartnerChoice(null)
          setTimeLeft(TIME_LIMIT_SECONDS)
          selectionSentRef.current = false
          startSelectionTimer()
          break

        case "balance-selected":
          // 상대방이 선택 완료 (UI에서 표시하지 않음)
          break

        case "balance-result":
          // 결과 수신 - 상대도 10초 내에 선택하면 바로 표시
          const resultData = {
            questionId: message.questionId,
            category: message.category,
            question: message.question,
            optionA: message.optionA,
            optionB: message.optionB,
            sameChoice: message.sameChoice,
            selections: message.selections,
          }
          displayResult(resultData)
          break
      }
    }

    const unsubscribe = signalingClient.onMessage(handleMessage)
    return () => {
      unsubscribe()
      clearTimers()
    }
  }, [signalingClient, sessionId, userId, open, displayResult, clearTimers, onOpenChange, toast])

  const startInviteTimer = () => {
    clearTimers()
    setStartTimeLeft(START_LIMIT_SECONDS)
    const startedAt = Date.now()

    startIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      setStartTimeLeft(Math.max(0, START_LIMIT_SECONDS - elapsed))
    }, 200)

    startTimeoutRef.current = setTimeout(() => {
      // 타임아웃 시 종료
      setGameState("idle")
      clearTimers()
      onOpenChange(false)
    }, START_LIMIT_SECONDS * 1000)
  }

  const startSelectionTimer = () => {
    clearTimers()
    setTimeLeft(TIME_LIMIT_SECONDS)
    const startedAt = Date.now()
    selectionStartTimeRef.current = startedAt

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      setTimeLeft(Math.max(0, TIME_LIMIT_SECONDS - elapsed))
    }, 200)

    timeoutRef.current = setTimeout(() => {
      // 10초가 지나면 결과 표시
      // 타임아웃 시 NONE 처리 (서버에서 처리하지만 UI 업데이트)
      selectionSentRef.current = true
      setPendingChoice(null)
      if (myChoiceRef.current === null) {
        setMyChoice("NONE")
      }
      if (partnerChoiceRef.current === null) {
        setPartnerChoice("NONE")
      }
    }, TIME_LIMIT_SECONDS * 1000)
  }

  const handleInvite = () => {
    if (!signalingClient) return
    setGameState("inviting")
    signalingClient.sendBalanceInvite(sessionId, userId)
    startInviteTimer()
  }

  const handleChoice = (choice: "A" | "B") => {
    if (selectionSentRef.current) return
    setPendingChoice(choice)
  }

  const handleConfirmChoice = () => {
    if (!signalingClient || selectionSentRef.current || !pendingChoice) return
    setMyChoice(pendingChoice)
    setPendingChoice(null)
    try {
      signalingClient.sendBalanceSelect(sessionId, userId, pendingChoice)
      selectionSentRef.current = true
      console.log("[BalanceGame] 선택 전송:", pendingChoice)
    } catch (error) {
      console.error("[BalanceGame] 선택 전송 실패:", error)
    }
  }

  const handleClose = () => {
    clearTimers()
    onOpenChange(false)
  }

  useEffect(() => {
    return clearTimers
  }, [])

  const isMatch = sameChoice === true
  const isNoChoice = myChoice === "NONE"
  const activeChoice = selectionSentRef.current ? myChoice : pendingChoice

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        showCloseButton={gameState === "idle" || gameState === "result"}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>밸런스 게임</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 초기 화면 - 게임 초대 */}
          {gameState === "idle" && (
            <>
              <div className="space-y-2 text-center">
                <p className="text-sm text-muted-foreground">상대방에게 게임 초대를 보내세요.</p>
              </div>
              <Button variant="default" className="w-full" onClick={handleInvite} disabled={!signalingClient}>
                게임 초대하기
              </Button>
            </>
          )}

          {/* 초대 대기 중 */}
          {gameState === "inviting" && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>상대방의 응답을 기다리는 중...</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                  <span>{startTimeLeft}초</span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-[width] duration-200"
                    style={{ width: `${((START_LIMIT_SECONDS - startTimeLeft) / START_LIMIT_SECONDS) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  10초 동안 응답이 없으면 자동으로 종료돼요.
                </p>
              </div>
            </>
          )}

          {/* 게임 시작 중 */}
          {gameState === "starting" && (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>게임 시작 중...</span>
            </div>
          )}

          {/* 게임 진행 중 - 질문 표시 */}
          {gameState === "started" && currentQuestion && (
            <>
              {/* 카테고리 표시 */}
              <div className="rounded-xl border border-border px-4 py-2 bg-muted/50">
                <p className="text-xs text-muted-foreground">{currentQuestion.category}</p>
              </div>

              {/* 질문 */}
              <div className="rounded-xl border border-border px-4 py-4 text-center">
                <p className="text-lg font-semibold leading-relaxed">{currentQuestion.question}</p>
              </div>

              {/* 타이머 */}
              {!partnerChoice && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>남은 시간</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{timeLeft}초</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-[width] duration-200"
                  style={{ width: `${((TIME_LIMIT_SECONDS - timeLeft) / TIME_LIMIT_SECONDS) * 100}%` }}
                />
              </div>
            </div>
              )}

              {/* 선택지 */}
              {!partnerChoice ? (
            <div className="space-y-3">
              <Button
                variant={activeChoice === "A" ? "default" : "outline"}
                    className={`w-full py-6 text-left justify-start transition-all ${
                      activeChoice === "A" ? "bg-primary text-primary-foreground border-primary" : ""
                    }`}
                    onClick={() => handleChoice("A")}
                    disabled={selectionSentRef.current}
                  >
                    <span className="w-8 h-8 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center mr-3 flex-shrink-0 font-semibold">
                  A
                </span>
                    <span className="flex-1">{currentQuestion.optionA}</span>
              </Button>
              <Button
                variant={activeChoice === "B" ? "default" : "outline"}
                    className={`w-full py-6 text-left justify-start transition-all ${
                      activeChoice === "B" ? "bg-primary text-primary-foreground border-primary" : ""
                    }`}
                    onClick={() => handleChoice("B")}
                    disabled={selectionSentRef.current}
                  >
                    <span className="w-8 h-8 rounded-full bg-secondary/20 dark:bg-secondary/30 flex items-center justify-center mr-3 flex-shrink-0 font-semibold">
                  B
                </span>
                    <span className="flex-1">{currentQuestion.optionB}</span>
              </Button>
              <Button
                variant="default"
                className="w-full"
                onClick={handleConfirmChoice}
                disabled={!pendingChoice || selectionSentRef.current}
              >
                선택
              </Button>
            </div>
              ) : (
                // 양쪽 모두 선택 완료 - 결과 미리보기
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div
                      className={`p-4 rounded-xl text-center border-2 transition-all ${
                    myChoice === "A"
                          ? "bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800"
                      : myChoice === "B"
                            ? "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800"
                            : "bg-card border-border"
                      }`}
                    >
                      <p className="text-xs text-muted-foreground mb-2">나의 선택</p>
                      <p className="text-2xl font-bold mb-1">{myChoice === "NONE" || myChoice === null ? "❌" : myChoice}</p>
                      <p className="text-xs text-muted-foreground">
                        {myChoice === "A"
                          ? currentQuestion.optionA
                          : myChoice === "B"
                            ? currentQuestion.optionB
                            : "선택 안함"}
                      </p>
                </div>
                <div
                      className={`p-4 rounded-xl text-center border-2 transition-all ${
                    partnerChoice === "A"
                          ? "bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800"
                      : partnerChoice === "B"
                            ? "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800"
                            : "bg-card border-border"
                      }`}
                    >
                      <p className="text-xs text-muted-foreground mb-2">상대방 선택</p>
                      <p className="text-2xl font-bold mb-1">
                        {partnerChoice === "NONE" || partnerChoice === null ? "❌" : partnerChoice}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {partnerChoice === "A"
                          ? currentQuestion.optionA
                          : partnerChoice === "B"
                            ? currentQuestion.optionB
                            : "선택 안함"}
                  </p>
                </div>
              </div>
                </div>
              )}
            </>
          )}

          {/* 게임 결과 */}
          {gameState === "result" && currentQuestion && (
            <>
              {/* 카테고리 */}
              <div className="rounded-xl border border-border px-4 py-2 bg-muted/50">
                <p className="text-xs text-muted-foreground">{currentQuestion.category}</p>
              </div>

              {/* 질문 */}
              <div className="rounded-xl border border-border px-4 py-4 text-center">
                <p className="text-lg font-semibold leading-relaxed">{currentQuestion.question}</p>
              </div>

              {/* 결과 카드 */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`p-4 rounded-xl text-center border-2 transition-all ${
                      myChoice === "A"
                        ? "bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800"
                        : myChoice === "B"
                          ? "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800"
                          : "bg-card border-border"
                    }`}
                  >
                    <p className="text-xs text-muted-foreground mb-2">나의 선택</p>
                    <p className="text-2xl font-bold mb-1">{myChoice === "NONE" || myChoice === null ? "❌" : myChoice}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {myChoice === "A"
                        ? currentQuestion.optionA
                        : myChoice === "B"
                          ? currentQuestion.optionB
                          : "선택 안함"}
                    </p>
            </div>
                  <div
                    className={`p-4 rounded-xl text-center border-2 transition-all ${
                      partnerChoice === "A"
                        ? "bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800"
                        : partnerChoice === "B"
                          ? "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800"
                          : "bg-card border-border"
                    }`}
                  >
                    <p className="text-xs text-muted-foreground mb-2">상대방 선택</p>
                    <p className="text-2xl font-bold mb-1">
                      {partnerChoice === "NONE" || partnerChoice === null ? "❌" : partnerChoice}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {partnerChoice === "A"
                        ? currentQuestion.optionA
                        : partnerChoice === "B"
                          ? currentQuestion.optionB
                          : "선택 안함"}
                    </p>
        </div>
      </div>

                {/* 결과 메시지 */}
                {!isNoChoice && (
                  <div
                    className={`p-4 rounded-xl text-center border-2 ${
                      isMatch
                        ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                        : "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800"
                    }`}
                  >
                    <p className="text-base font-semibold mb-1">{isMatch ? "🎉 같은 선택이에요!" : "💭 다른 의견이에요!"}</p>
                    <p className="text-sm text-muted-foreground">
                      {isMatch
                        ? "이 주제로 대화를 나눠보세요!"
                        : "서로의 의견을 들어보며 대화를 나눠보세요!"}
                    </p>
                  </div>
                )}
              </div>

              <Button variant="default" className="w-full" onClick={handleClose}>
                닫기
              </Button>
            </>
          )}
    </div>
      </DialogContent>
    </Dialog>
  )
}
