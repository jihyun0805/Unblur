"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Heart, X } from "lucide-react"
import type { VoteChoice } from "@/lib/webrtc-signaling"
import { ConfirmLeaveModal } from "@/components/session/confirm-leave-modal"

interface RoundVoteModalProps {
  open: boolean
  currentRound: number
  onResult: (continued: boolean, partnerWantsContinue: boolean) => void
  /** 거절 확정 시(별점으로 이동) 부모에서 vote 닫고 별점 모달 열 때 사용 */
  onRejectConfirm?: () => void
  sendVote?: (vote: VoteChoice) => void
  conferenceId?: string
  userId?: string
}

const ROUND_NAMES = ["1라운드", "2라운드", "3라운드", "최종 라운드"]

export function RoundVoteModal({
  open,
  currentRound,
  onResult,
  onRejectConfirm,
  sendVote,
  conferenceId,
  userId,
}: RoundVoteModalProps) {
  const [myVote, setMyVote] = useState<"continue" | "leave" | null>(null)
  const [partnerVote, setPartnerVote] = useState<"continue" | "leave" | null>(null)
  const [isWaiting, setIsWaiting] = useState(false)
  /** 거절 클릭 후 "정말 거절하시겠습니까?" 확인 대기 */
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  /** 결과 화면 표시 후 별점으로 넘길 때 (상대 거절 또는 내가 거절 확정) */
  const [showResultThenRate, setShowResultThenRate] = useState(false)
  /** "다음라운드로 진행됩니다! 블러가 해제 됩니다!" 안내 후 다음 라운드 진행 */
  const [showNextRoundAnnounce, setShowNextRoundAnnounce] = useState(false)

  const useBackend = Boolean(sendVote && conferenceId && userId)

  useEffect(() => {
    if (!open) {
      setMyVote(null)
      setPartnerVote(null)
      setIsWaiting(false)
      setShowLeaveConfirm(false)
      setShowResultThenRate(false)
      setShowNextRoundAnnounce(false)
    }
  }, [open])

  const handleVote = (vote: "continue" | "leave") => {
    if (vote === "leave") {
      setShowLeaveConfirm(true)
      return
    }

    setMyVote(vote)
    setIsWaiting(true)

    if (useBackend && sendVote) {
      sendVote("PROCEED")
      return
    }

    // 로컬 시뮬레이션 (BE 미연동 시)
    setTimeout(() => {
      const partnerWantsContinue = Math.random() > 0.3
      setPartnerVote(partnerWantsContinue ? "continue" : "leave")
      setIsWaiting(false)
      if (partnerWantsContinue) {
        setShowNextRoundAnnounce(true)
      } else {
        setShowResultThenRate(true)
      }
    }, 2000)
  }

  /** 거절 확인 모달에서 "Yes" → 별점으로 */
  const confirmReject = () => {
    setShowLeaveConfirm(false)
    if (onRejectConfirm) {
      onRejectConfirm()
      return
    }
    setMyVote("leave")
    setPartnerVote(null)
    setShowResultThenRate(true)
  }

  /** 거절 확인 모달에서 "No" → 다시 투표하기 */
  const cancelReject = () => {
    setShowLeaveConfirm(false)
  }

  /** (로컬) 거절 확정 후 상대 응답 시 결과만 표시하고 별점으로 */
  const confirmLeave = () => {
    setShowLeaveConfirm(false)
    setMyVote("leave")
    setIsWaiting(true)

    if (useBackend && sendVote) {
      sendVote("END")
      return
    }

    setTimeout(() => {
      const partnerWantsContinue = Math.random() > 0.3
      setPartnerVote(partnerWantsContinue ? "continue" : "leave")
      setIsWaiting(false)
      setShowResultThenRate(true)
    }, 2000)
  }

  const handleResultThenRateDone = () => {
    setShowResultThenRate(false)
    onResult(false, false)
  }

  const handleNextRoundAnnounceDone = () => {
    setShowNextRoundAnnounce(false)
    onResult(true, true)
  }

  const nextRoundName = currentRound < 3 ? ROUND_NAMES[currentRound + 1] : null

  // 1) 결과 화면 후 별점으로
  if (showResultThenRate) {
    return (
      <Dialog open={open}>
        <DialogContent className="sm:max-w-md bg-background" showCloseButton={false}>
          <DialogTitle className="sr-only">투표 결과</DialogTitle>
          <div className="py-4 text-center">
            <h2 className="text-xl font-bold mb-2">투표 결과</h2>
            <div className="grid grid-cols-2 gap-4 my-4">
              <div className={`p-4 rounded-xl ${myVote === "continue" ? "bg-green-100" : "bg-red-100"}`}>
                <p className="text-sm text-muted-foreground mb-1">나의 선택</p>
                <p className="font-semibold">{myVote === "continue" ? "계속하기" : "그만하기"}</p>
              </div>
              <div className="p-4 rounded-xl bg-red-100">
                <p className="text-sm text-muted-foreground mb-1">상대방 선택</p>
                <p className="font-semibold">그만하기</p>
              </div>
            </div>
            <p className="text-muted-foreground mb-6">아쉽지만 여기서 마무리할게요.</p>
            <Button onClick={handleResultThenRateDone} className="w-full py-6 bg-primary text-primary-foreground hover:bg-primary/90">
              별점 남기기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // 2) 다음 라운드 안내 후 진행
  if (showNextRoundAnnounce) {
    return (
      <Dialog open={open}>
        <DialogContent className="sm:max-w-md bg-background" showCloseButton={false}>
          <DialogTitle className="sr-only">다음 라운드</DialogTitle>
          <div className="py-4 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">다음 라운드로 진행됩니다!</h2>
            <p className="text-muted-foreground mb-6">블러가 해제 됩니다!</p>
            <Button onClick={handleNextRoundAnnounceDone} className="w-full py-6 bg-primary text-primary-foreground hover:bg-primary/90">
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <Dialog open={open}>
        <DialogContent className="sm:max-w-md bg-background" showCloseButton={false}>
          <DialogTitle className="sr-only">{ROUND_NAMES[currentRound]} 종료</DialogTitle>
          <div className="py-4 text-center">
            <h2 className="text-xl font-bold mb-2">{ROUND_NAMES[currentRound]} 종료!</h2>
          <p className="text-muted-foreground mb-6">
            {nextRoundName ? `${nextRoundName}로 넘어갈까요?` : "대화를 계속할까요?"}
          </p>

            {myVote === null ? (
              <div className="space-y-3">
                <Button
                  onClick={() => handleVote("continue")}
                  className="w-full py-6 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  대화 계속하기
                </Button>
                <Button variant="outline" onClick={() => handleVote("leave")} className="w-full py-6">
                  <X className="w-5 h-5 mr-2" />
                  여기서 그만하기
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl ${myVote === "continue" ? "bg-green-100" : "bg-red-100"}`}>
                    <p className="text-sm text-muted-foreground mb-1">나의 선택</p>
                    <p className="font-semibold">{myVote === "continue" ? "계속하기" : "그만하기"}</p>
                  </div>
                  <div
                    className={`p-4 rounded-xl ${
                      partnerVote === null ? "bg-muted" : partnerVote === "continue" ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    <p className="text-sm text-muted-foreground mb-1">상대방 선택</p>
                    {isWaiting ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <p className="text-xs text-muted-foreground">상대방 응답 대기 중...</p>
                      </div>
                    ) : (
                      <p className="font-semibold">{partnerVote === "continue" ? "계속하기" : "그만하기"}</p>
                    )}
                  </div>
                </div>

                {!useBackend && !isWaiting && partnerVote && (
                  <div
                    className={`p-4 rounded-xl ${
                      myVote === "continue" && partnerVote === "continue" ? "bg-green-100" : "bg-muted"
                    }`}
                  >
                    {myVote === "continue" && partnerVote === "continue" ? (
                      <p className="font-semibold text-green-700">서로 대화를 원해요! 다음 라운드로 이동합니다.</p>
                    ) : myVote === "leave" && partnerVote === "continue" ? (
                      <p className="font-semibold text-amber-700">상대방은 계속하고 싶어해요...</p>
                    ) : (
                      <p className="font-semibold text-muted-foreground">아쉽지만 여기서 마무리할게요.</p>
                    )}
                  </div>
                )}
                {useBackend && isWaiting && (
                  <p className="text-sm text-muted-foreground text-center">상대방 응답 대기 중...</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmLeaveModal
        open={showLeaveConfirm}
        onConfirmLeave={!useBackend ? confirmReject : confirmLeave}
        onContinue={cancelReject}
        title="정말 거절하시겠습니까?"
        description="세션이 종료됩니다."
        confirmLabel="예, 거절할게요"
        continueLabel="아니오, 다시 투표할게요"
      />
    </>
  )
}
