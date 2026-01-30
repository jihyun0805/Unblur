"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Heart, Loader2, X } from "lucide-react"

interface BalanceGameOverlayProps {
  onClose: () => void
}

const QUESTIONS = [
  {
    section: "1. 요즘 감성 밸런스 (Z세대/밈 감성)",
    question: "카톡 프사 안 바꿈 vs 프사 자주 바꿈",
    optionA: "카톡 프사 안 바꿈",
    optionB: "프사 자주 바꿈",
  },
  {
    section: "1. 요즘 감성 밸런스 (Z세대/밈 감성)",
    question: "인스타 안 올림 vs 스토리 매일 올림",
    optionA: "인스타 안 올림",
    optionB: "스토리 매일 올림",
  },
  {
    section: "1. 요즘 감성 밸런스 (Z세대/밈 감성)",
    question: "사진 보정 과함 vs 보정 거의 없음",
    optionA: "사진 보정 과함",
    optionB: "보정 거의 없음",
  },
  {
    section: "1. 요즘 감성 밸런스 (Z세대/밈 감성)",
    question: "셀카 안 찍음 vs 셀카 장인",
    optionA: "셀카 안 찍음",
    optionB: "셀카 장인",
  },
  {
    section: "1. 요즘 감성 밸런스 (Z세대/밈 감성)",
    question: "SNS 눈팅만 vs 댓글 요정",
    optionA: "SNS 눈팅만",
    optionB: "댓글 요정",
  },
  {
    section: "2. 스타일 & 패션 밸런스",
    question: "무채톤 올블랙 vs 컬러 포인트 필수",
    optionA: "무채톤 올블랙",
    optionB: "컬러 포인트 필수",
  },
  {
    section: "2. 스타일 & 패션 밸런스",
    question: "편한 게 최고 vs 불편해도 스타일",
    optionA: "편한 게 최고",
    optionB: "불편해도 스타일",
  },
  {
    section: "2. 스타일 & 패션 밸런스",
    question: "꾸안꾸 vs 꾸꾸꾸",
    optionA: "꾸안꾸",
    optionB: "꾸꾸꾸",
  },
  {
    section: "2. 스타일 & 패션 밸런스",
    question: "운동화만 신기 vs 상황별 신발",
    optionA: "운동화만 신기",
    optionB: "상황별 신발",
  },
  {
    section: "2. 스타일 & 패션 밸런스",
    question: "가방 하나 돌려쓰기 vs 코디별 가방",
    optionA: "가방 하나 돌려쓰기",
    optionB: "코디별 가방",
  },
  {
    section: "3. 성격 드러나는 밸런스",
    question: "생각 많고 말 적음 vs 생각 적고 말 많음",
    optionA: "생각 많고 말 적음",
    optionB: "생각 적고 말 많음",
  },
  {
    section: "3. 성격 드러나는 밸런스",
    question: "눈치 빠른 편 vs 솔직한 편",
    optionA: "눈치 빠른 편",
    optionB: "솔직한 편",
  },
  {
    section: "3. 성격 드러나는 밸런스",
    question: "완벽하려다 미룸 vs 대충이라도 바로 함",
    optionA: "완벽하려다 미룸",
    optionB: "대충이라도 바로 함",
  },
  {
    section: "3. 성격 드러나는 밸런스",
    question: "혼자 있어야 충전 vs 사람 있어야 충전",
    optionA: "혼자 있어야 충전",
    optionB: "사람 있어야 충전",
  },
  {
    section: "3. 성격 드러나는 밸런스",
    question: "결정 오래 vs 결정 빠름",
    optionA: "결정 오래",
    optionB: "결정 빠름",
  },
  {
    section: "4. 생활 습관 밸런스 (공감 폭발)",
    question: "알람 10개 vs 알람 1개",
    optionA: "알람 10개",
    optionB: "알람 1개",
  },
  {
    section: "4. 생활 습관 밸런스 (공감 폭발)",
    question: "미루다 몰아서 vs 조금씩 꾸준히",
    optionA: "미루다 몰아서",
    optionB: "조금씩 꾸준히",
  },
  {
    section: "4. 생활 습관 밸런스 (공감 폭발)",
    question: "방은 더러운데 머릿속 정리됨 vs 방은 깨끗한데 머릿속 복잡",
    optionA: "방은 더러운데 머릿속 정리됨",
    optionB: "방은 깨끗한데 머릿속 복잡",
  },
  {
    section: "4. 생활 습관 밸런스 (공감 폭발)",
    question: "집 오면 바로 눕기 vs 집 오면 할 일 다 하고 눕기",
    optionA: "집 오면 바로 눕기",
    optionB: "집 오면 할 일 다 하고 눕기",
  },
  {
    section: "4. 생활 습관 밸런스 (공감 폭발)",
    question: "야식 포기 못함 vs 야식 안 먹음",
    optionA: "야식 포기 못함",
    optionB: "야식 안 먹음",
  },
  {
    section: "5. 음식 취향 밸런스 (무조건 터짐)",
    question: "평생 같은 메뉴 vs 매번 새로운 메뉴",
    optionA: "평생 같은 메뉴",
    optionB: "매번 새로운 메뉴",
  },
  {
    section: "5. 음식 취향 밸런스 (무조건 터짐)",
    question: "맛집 줄 서기 vs 근처 아무 데나",
    optionA: "맛집 줄 서기",
    optionB: "근처 아무 데나",
  },
  {
    section: "5. 음식 취향 밸런스 (무조건 터짐)",
    question: "양 많고 평범 vs 양 적고 맛집",
    optionA: "양 많고 평범",
    optionB: "양 적고 맛집",
  },
  {
    section: "5. 음식 취향 밸런스 (무조건 터짐)",
    question: "단짠 러버 vs 담백파",
    optionA: "단짠 러버",
    optionB: "담백파",
  },
  {
    section: "5. 음식 취향 밸런스 (무조건 터짐)",
    question: "배불러도 디저트 vs 디저트는 배 따로",
    optionA: "배불러도 디저트",
    optionB: "디저트는 배 따로",
  },
  {
    section: "6. 여행 & 여가 밸런스",
    question: "여행 일정 빼곡 vs 발 닿는 대로",
    optionA: "여행 일정 빼곡",
    optionB: "발 닿는 대로",
  },
  {
    section: "6. 여행 & 여가 밸런스",
    question: "사진 100장 vs 사진 거의 안 찍음",
    optionA: "사진 100장",
    optionB: "사진 거의 안 찍음",
  },
  {
    section: "6. 여행 & 여가 밸런스",
    question: "힐링 여행 vs 관광 풀코스",
    optionA: "힐링 여행",
    optionB: "관광 풀코스",
  },
  {
    section: "6. 여행 & 여가 밸런스",
    question: "혼자 여행 vs 여럿이 여행",
    optionA: "혼자 여행",
    optionB: "여럿이 여행",
  },
  {
    section: "6. 여행 & 여가 밸런스",
    question: "숙소 중요 vs 밖에서 노는 게 중요",
    optionA: "숙소 중요",
    optionB: "밖에서 노는 게 중요",
  },
  {
    section: "7. 디지털 & 미디어 밸런스",
    question: "유튜브 알고리즘 신뢰 vs 직접 검색",
    optionA: "유튜브 알고리즘 신뢰",
    optionB: "직접 검색",
  },
  {
    section: "7. 디지털 & 미디어 밸런스",
    question: "영상 배속 필수 vs 정속 시청",
    optionA: "영상 배속 필수",
    optionB: "정속 시청",
  },
  {
    section: "7. 디지털 & 미디어 밸런스",
    question: "넷플릭스 정주행 vs 짧은 영상 무한 스크롤",
    optionA: "넷플릭스 정주행",
    optionB: "짧은 영상 무한 스크롤",
  },
  {
    section: "7. 디지털 & 미디어 밸런스",
    question: "댓글 먼저 봄 vs 영상만 봄",
    optionA: "댓글 먼저 봄",
    optionB: "영상만 봄",
  },
  {
    section: "7. 디지털 & 미디어 밸런스",
    question: "플레이리스트 있음 vs 그때그때 검색",
    optionA: "플레이리스트 있음",
    optionB: "그때그때 검색",
  },
  {
    section: "8. 극단 밸런스 (웃음 담당)",
    question: "평생 같은 노래 vs 평생 랜덤 노래",
    optionA: "평생 같은 노래",
    optionB: "평생 랜덤 노래",
  },
  {
    section: "8. 극단 밸런스 (웃음 담당)",
    question: "여름에 패딩 vs 겨울에 반팔",
    optionA: "여름에 패딩",
    optionB: "겨울에 반팔",
  },
  {
    section: "8. 극단 밸런스 (웃음 담당)",
    question: "사진 찍힐 때마다 눈 감기 vs 항상 어색한 포즈",
    optionA: "사진 찍힐 때마다 눈 감기",
    optionB: "항상 어색한 포즈",
  },
  {
    section: "8. 극단 밸런스 (웃음 담당)",
    question: "웃음 참기 불가 vs 리액션 로봇",
    optionA: "웃음 참기 불가",
    optionB: "리액션 로봇",
  },
  {
    section: "8. 극단 밸런스 (웃음 담당)",
    question: "말하다가 결론 없음 vs 결론만 말함",
    optionA: "말하다가 결론 없음",
    optionB: "결론만 말함",
  },
]

const TIME_LIMIT_SECONDS = 10
const START_LIMIT_SECONDS = 10

export function BalanceGameOverlay({ onClose }: BalanceGameOverlayProps) {
  const questions = useMemo(() => {
    const shuffled = [...QUESTIONS]
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [myChoice, setMyChoice] = useState<"A" | "B" | "NONE" | null>(null)
  const [partnerChoice, setPartnerChoice] = useState<"A" | "B" | "NONE" | null>(null)
  const [isWaiting, setIsWaiting] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [myReady, setMyReady] = useState(false)
  const [partnerReady, setPartnerReady] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS)
  const [startTimeLeft, setStartTimeLeft] = useState(START_LIMIT_SECONDS)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const partnerAcceptRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const myReadyRef = useRef(false)
  const partnerReadyRef = useRef(false)
  const onCloseRef = useRef(onClose)
  const myChoiceRef = useRef<"A" | "B" | "NONE" | null>(null)
  const partnerChoiceRef = useRef<"A" | "B" | "NONE" | null>(null)

  const question = questions[currentQuestion]

  const handleChoice = (choice: "A" | "B") => {
    setMyChoice(choice)
    setIsWaiting(true)

    // Simulate partner choosing
    setTimeout(() => {
      const partnerPick = Math.random() > 0.5 ? "A" : "B"
      setPartnerChoice(partnerPick)
      if (myChoiceRef.current) {
        setShowResult(true)
        setIsWaiting(false)
      }
    }, 1500)
  }

  const clearTimers = () => {
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
    if (partnerAcceptRef.current) {
      clearTimeout(partnerAcceptRef.current)
      partnerAcceptRef.current = null
    }
    if (startIntervalRef.current) {
      clearInterval(startIntervalRef.current)
      startIntervalRef.current = null
    }
  }

  useEffect(() => clearTimers, [])

  useEffect(() => {
    myReadyRef.current = myReady
    partnerReadyRef.current = partnerReady
  }, [myReady, partnerReady])

  useEffect(() => {
    myChoiceRef.current = myChoice
    partnerChoiceRef.current = partnerChoice
  }, [myChoice, partnerChoice])

  useEffect(() => {
    if (!gameStarted && myReady && partnerReady) {
      startGame()
    }
  }, [gameStarted, myReady, partnerReady])

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const startGame = () => {
    setGameStarted(true)
    setCurrentQuestion(0)
    setMyChoice(null)
    setPartnerChoice(null)
    setShowResult(false)
    setIsWaiting(false)
  }

  useEffect(() => {
    clearTimers()
    if (!gameStarted || showResult) {
      return
    }

    setTimeLeft(TIME_LIMIT_SECONDS)
    const startedAt = Date.now()

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      setTimeLeft(Math.max(0, TIME_LIMIT_SECONDS - elapsed))
    }, 200)

    timeoutRef.current = setTimeout(() => {
      setIsWaiting(false)
      setMyChoice((prev) => prev ?? "NONE")
      setPartnerChoice((prev) => prev ?? "NONE")
      setShowResult(true)
    }, TIME_LIMIT_SECONDS * 1000)

    return clearTimers
  }, [currentQuestion, gameStarted, showResult])

  useEffect(() => {
    if (!gameStarted || showResult) {
      return
    }

    if (myChoice && partnerChoice) {
      clearTimers()
      setShowResult(true)
      setIsWaiting(false)
    }
  }, [gameStarted, myChoice, partnerChoice, showResult])

  useEffect(() => {
    if (gameStarted) {
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current)
        startTimeoutRef.current = null
      }
      if (startIntervalRef.current) {
        clearInterval(startIntervalRef.current)
        startIntervalRef.current = null
      }
      return
    }

    setStartTimeLeft(START_LIMIT_SECONDS)
    const startedAt = Date.now()

    if (!startIntervalRef.current) {
      startIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000)
        setStartTimeLeft(Math.max(0, START_LIMIT_SECONDS - elapsed))
      }, 200)
    }

    if (!startTimeoutRef.current) {
      startTimeoutRef.current = setTimeout(() => {
        if (myReadyRef.current && partnerReadyRef.current) {
          startGame()
        } else {
          onCloseRef.current()
        }
      }, START_LIMIT_SECONDS * 1000)
    }

    return () => {
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current)
        startTimeoutRef.current = null
      }
      if (startIntervalRef.current) {
        clearInterval(startIntervalRef.current)
        startIntervalRef.current = null
      }
    }
  }, [gameStarted])

  const handleNext = () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
      setMyChoice(null)
      setPartnerChoice(null)
      setShowResult(false)
      setIsWaiting(false)
    } else {
      onClose()
    }
  }

  const isMatch = myChoice !== null && myChoice !== "NONE" && myChoice === partnerChoice
  const isNoChoice = myChoice === "NONE"

  useEffect(() => {
    if (!showResult) {
      return
    }

    const closeTimer = setTimeout(() => {
      onCloseRef.current()
    }, 10000)

    return () => {
      clearTimeout(closeTimer)
    }
  }, [showResult])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-background rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">밸런스 게임</h3>
          {(showResult || !gameStarted) && (
            <button onClick={onClose} aria-label="닫기">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="p-6">
          {!gameStarted ? (
            <div className="space-y-6">
              <div className="mb-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>남은 시간</span>
                  <span>{startTimeLeft}초</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-[width] duration-200"
                    style={{ width: `${((START_LIMIT_SECONDS - startTimeLeft) / START_LIMIT_SECONDS) * 100}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2 text-center">
                <h4 className="text-xl font-bold">게임을 시작할까요?</h4>
                <p className="text-sm text-muted-foreground">
                  10초 동안 상대 또는 내가 선택하지 않으면 자동으로 종료돼요.
                </p>
              </div>
              <Button
                variant={myReady ? "default" : "outline"}
                className={`w-full ${myReady ? "bg-primary text-primary-foreground" : ""}`}
                onClick={() => {
                  setMyReady(true)
                  if (!partnerAcceptRef.current) {
                    partnerAcceptRef.current = setTimeout(() => {
                      setPartnerReady(true)
                    }, 1500)
                  }
                }}
                disabled={myReady}
              >
                시작하기
              </Button>
            </div>
          ) : (
            !showResult && (
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>남은 시간</span>
                <span>{timeLeft}초</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-[width] duration-200"
                  style={{ width: `${((TIME_LIMIT_SECONDS - timeLeft) / TIME_LIMIT_SECONDS) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {gameStarted && <h4 className="text-xl font-bold text-center mb-6">{question.question}</h4>}

          {gameStarted && !showResult ? (
            <div className="space-y-3">
              <Button
                variant={myChoice === "A" ? "default" : "outline"}
                className={`w-full py-6 text-left justify-start ${myChoice === "A" ? "bg-primary text-primary-foreground" : ""}`}
                onClick={() => !isWaiting && handleChoice("A")}
                disabled={isWaiting}
              >
                <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3 flex-shrink-0">
                  A
                </span>
                {question.optionA}
              </Button>
              <Button
                variant={myChoice === "B" ? "default" : "outline"}
                className={`w-full py-6 text-left justify-start ${myChoice === "B" ? "bg-primary text-primary-foreground" : ""}`}
                onClick={() => !isWaiting && handleChoice("B")}
                disabled={isWaiting}
              >
                <span className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center mr-3 flex-shrink-0">
                  B
                </span>
                {question.optionB}
              </Button>

              {isWaiting && (
                <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  상대방 선택 대기 중...
                </div>
              )}
            </div>
          ) : gameStarted ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-xl text-center ${
                    myChoice === "A"
                      ? "bg-pink-50 border-2 border-pink-200"
                      : myChoice === "B"
                        ? "bg-sky-50 border-2 border-sky-200"
                        : "bg-card"
                  }`}
                >
                  <p className="text-base text-muted-foreground mb-1">나의 선택</p>
                  <p className="text-lg font-semibold">{myChoice === "NONE" || myChoice === null ? "선택 안함" : myChoice}</p>
                </div>
                <div
                  className={`p-4 rounded-xl text-center ${
                    partnerChoice === "A"
                      ? "bg-pink-50 border-2 border-pink-200"
                      : partnerChoice === "B"
                        ? "bg-sky-50 border-2 border-sky-200"
                        : "bg-card"
                  }`}
                >
                  <p className="text-base text-muted-foreground mb-1">상대방 선택</p>
                  <p className="text-lg font-semibold">
                    {partnerChoice === "NONE" || partnerChoice === null ? "선택 안함" : partnerChoice}
                  </p>
                </div>
              </div>
              {!isNoChoice && (
                <div className="text-center text-sm text-muted-foreground">
                  {isMatch
                    ? "같은 걸 선택했어요. 이 주제로 대화를 나눠보세요!"
                    : "서로 다른 의견이에요. 이 주제로 대화를 나눠보세요!"}
                </div>
              )}

            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
