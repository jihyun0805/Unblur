"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Heart, Loader2 } from "lucide-react"

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

export function BalanceGameOverlay({ onClose }: BalanceGameOverlayProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [myChoice, setMyChoice] = useState<"A" | "B" | null>(null)
  const [partnerChoice, setPartnerChoice] = useState<"A" | "B" | null>(null)
  const [isWaiting, setIsWaiting] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const question = QUESTIONS[currentQuestion]

  const handleChoice = (choice: "A" | "B") => {
    setMyChoice(choice)
    setIsWaiting(true)

    // Simulate partner choosing
    setTimeout(() => {
      const partnerPick = Math.random() > 0.5 ? "A" : "B"
      setPartnerChoice(partnerPick)
      setIsWaiting(false)
      setShowResult(true)
    }, 1500)
  }

  const handleNext = () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion((prev) => prev + 1)
      setMyChoice(null)
      setPartnerChoice(null)
      setShowResult(false)
    } else {
      onClose()
    }
  }

  const isMatch = myChoice === partnerChoice

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-background rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">밸런스 게임</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {currentQuestion + 1} / {QUESTIONS.length}
            </span>
            <button onClick={onClose}>
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <h4 className="text-xl font-bold text-center mb-6">{question.question}</h4>

          {!showResult ? (
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
          ) : (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl text-center ${isMatch ? "bg-green-100 border-2 border-green-500" : "bg-accent/30"}`}>
                {isMatch ? (
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                      <span className="font-semibold text-green-700">취향이 같아요!</span>
                    </div>
                    <p className="text-sm text-green-600">이 주제로 대화를 나눠보세요</p>
                  </div>
                ) : (
                  <div>
                    <span className="font-semibold text-muted-foreground">서로 다른 취향이네요</span>
                    <p className="text-sm text-muted-foreground mt-1">다양성도 좋아요!</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-card text-center">
                  <p className="text-sm text-muted-foreground mb-1">나의 선택</p>
                  <p className="font-semibold">{myChoice}</p>
                </div>
                <div className="p-4 rounded-xl bg-card text-center">
                  <p className="text-sm text-muted-foreground mb-1">상대방 선택</p>
                  <p className="font-semibold">{partnerChoice}</p>
                </div>
              </div>

              <Button onClick={handleNext} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {currentQuestion < QUESTIONS.length - 1 ? "다음 질문" : "게임 종료"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
