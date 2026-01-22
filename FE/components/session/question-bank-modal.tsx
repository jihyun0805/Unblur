"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X } from "lucide-react"

interface QuestionBankModalProps {
  open: boolean
  round: number
  onClose: () => void
}

export const ROUND_1_QUESTIONS = [
  "요즘 빠져 있는 취미 있나요?",
  "요즘 가장 관심 있는 게 있다면 무엇인가요?",
  "긴 연휴가 주어졌습니다! 어떤것부터 하실건가요?",
  "스트레스 받을 때 주로 어떻게 푸시나요?",
  "쉬는 날에는 보통 무엇을 하면서 지내나요?",
  "가장 인상깊은 여행지가 있나요?",
  "하루 중 가장 좋아하는 시간대는 언제인가요?",
  "요즘 하루 일과는 보통 어떻게 흘러가나요?",
  "최근에 재미있게 본 영화나 드라마가 있나요?",
  "새로운 사람을 만나는 건 즐기는 편인가요?",
  "요즘 가장 기분 좋아지는 순간은 언제인가요?",
  "평소 음악은 어떤 분위기를 많이 듣나요?",
  "하루에 꼭 필요한 루틴이 있나요?",
  "최근에 가장 재밌었던 일이 있나요?",
  "좋아하는 음식이 뭔가요?",
  "자신의 인생 영화나 드라마를 소개해주세요!",
  "자신의 인생맛집을 소개해주세요!",
  "살면서 가장 열정적이었던 순간이 있나요?",
]

export const ROUND_2_QUESTIONS = [
  "연애에서 가장 중요하다고 생각하는 가치는 무엇인가요?",
  "연인과 취향이 달라도 괜찮다고 생각하나요?",
  "연인과 의견이 다를 때 어떻게 조율하는 편인가요?",
  "연애할 때 사소한 이벤트는 중요하다고 생각하나요?",
  "연인에게 기대는 편인가요, 스스로 해결하려는 편인가요?",
  "연인과 함께 보내는 시간은 얼마나 중요하다고 느끼나요?",
  "연애할 때 신뢰는 어떻게 쌓인다고 생각하나요?",
  "연애를 시작할 때 가장 중요하게 보는 부분은 무엇인가요?",
  "연인과의 대화에서 꼭 필요하다고 생각하는 요소는 무엇인가요?",
  "연인과 오래 만나기 위해 가장 필요하다고 생각하는 것은 무엇인가요?",
  "연애 중 혼자만의 시간은 얼마나 필요한가요?",
  "자신이 바라는 이상적인 연애 스타일이 있나요?",
  "연애할 때 이것만큼은 양보할 수 없다고 생각하는 기준이 있나요?",
  "연락 주기는 어느 정도가 가장 편하다고 생각하나요?",
  "서운한 일이 생기면 바로 말하는 스타일인가요?",
  "연인과 갈등이 생겼을 때 가장 중요하다고 느끼는 태도는 무엇인가요?",
  "연애할 때 감정 표현과 행동 중 어느 쪽이 더 중요하다고 생각하나요?",
  "연인에게 힘든 일이 있을 때 어떤 방식의 위로가 좋다고 생각하나요?",
  "연애 중 상대방의 일상에 어느 정도까지 공유하는 게 편하다고 느끼나요?",
  "연애할 때 상대방의 친구나 주변 관계는 얼마나 중요하다고 생각하나요?",
  "연애에서 편안함과 설렘 중 어떤 요소가 더 중요하다고 생각하나요?",
  "연인과의 약속이나 작은 신뢰는 어떻게 지켜져야 한다고 생각하나요?",
  "연애를 오래 유지하기 위해 가장 필요하다고 느끼는 노력은 무엇인가요?",
  "연애할 때 기념일은 어느 정도까지 챙기는 게 좋다고 생각하나요?",
  "데이트 비용은 어떻게 나누는 게 편하다고 생각하나요?",
  "데이트 장소는 분위기와 편안함 중 무엇이 더 중요하다고 느끼나요?",
  "데이트 계획은 미리 세우는 게 좋다고 생각하나요, 즉흥적인 게 더 좋다고 생각하나요?",
  "상대와 같이 가고싶은 데이트 장소가 있나요?",
  "연인과 함께하는 데이트 빈도는 어느 정도가 적당하다고 느끼나요?",
  "만나는 날을 고정적으로 정하는게 좋나요? 즉흥적으로 만나는게 좋나요?",
  "만약에 데이트 스타일이 많이 다르다는 걸 알게 되면 맞춰나가는 편인가요?",
  "연애 중 사소한 다툼은 어떻게 풀리는 게 좋다고 생각하나요?",
  "연애에서 신뢰가 깨졌을 때 회복이 가능하다고 생각하나요?",
  "연애에서 서로의 생활 리듬을 맞추는 게 중요하다고 생각하나요?",
  "연애할 때 상대에게 바라는 점이 있나요?",
  "연인과의 관계에서 가장 중요하게 지키고 싶은 태도는 무엇인가요?",
]

export function getRoundQuestions(round: number) {
  if (round === 0) return ROUND_1_QUESTIONS
  if (round === 1) return ROUND_2_QUESTIONS
  if (round === 2) return ROUND_2_QUESTIONS
  return ROUND_2_QUESTIONS
}

export function getRoundLabel(round: number) {
  if (round === 0) return "1라운드"
  if (round === 1) return "2라운드"
  if (round === 2) return "3라운드"
  return "4라운드"
}

export function QuestionBankModal({ open, round, onClose }: QuestionBankModalProps) {
  const questions = getRoundQuestions(round)
  const roundLabel = getRoundLabel(round)

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-lg bg-background" showCloseButton={false}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">질문 사전</h3>
            <p className="text-sm text-muted-foreground">{roundLabel}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {questions.length > 0 ? (
          <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-2">
            {questions.map((question, index) => (
              <div key={`${roundLabel}-${index}`} className="rounded-xl border border-border px-4 py-3 text-sm">
                {question}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 text-sm text-muted-foreground">질문이 없습니다.</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
