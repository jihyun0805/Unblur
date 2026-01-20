"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Heart, X } from "lucide-react"

interface RoundVoteModalProps {
  open: boolean
  currentRound: number
  onResult: (continued: boolean, partnerWantsContinue: boolean) => void
}

const ROUND_NAMES = ["1라운드", "2라운드", "3라운드", "최종 라운드"]

export function RoundVoteModal({ open, currentRound, onResult }: RoundVoteModalProps) {
  const [myVote, setMyVote] = useState<"continue" | "leave" | null>(null)
  const [partnerVote, setPartnerVote] = useState<"continue" | "leave" | null>(null)
  const [isWaiting, setIsWaiting] = useState(false)

  useEffect(() => {
    if (!open) {
      setMyVote(null)
      setPartnerVote(null)
      setIsWaiting(false)
    }
  }, [open])

  const handleVote = (vote: "continue" | "leave") => {
    setMyVote(vote)
    setIsWaiting(true)

    // Simulate partner voting
    setTimeout(() => {
      // 70% chance partner wants to continue
      const partnerWantsContinue = Math.random() > 0.3
      setPartnerVote(partnerWantsContinue ? "continue" : "leave")
      setIsWaiting(false)

      setTimeout(() => {
        const continued = vote === "continue" && partnerWantsContinue
        onResult(continued, partnerWantsContinue)
      }, 1500)
    }, 2000)
  }

  const nextRoundName = currentRound < 3 ? ROUND_NAMES[currentRound + 1] : null

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md bg-background" hideClose>
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
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  ) : (
                    <p className="font-semibold">{partnerVote === "continue" ? "계속하기" : "그만하기"}</p>
                  )}
                </div>
              </div>

              {!isWaiting && partnerVote && (
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
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
