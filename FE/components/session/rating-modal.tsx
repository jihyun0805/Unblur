"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Star, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface RatingModalProps {
  open: boolean
  onComplete: () => void
  onClose?: () => void
  partnerNickname: string
}

const RATING_LABELS = ["매우 불쾌", "불쾌", "보통", "좋음", "매우 좋음"]

export function RatingModal({ open, onComplete, onClose, partnerNickname }: RatingModalProps) {
  const { updateTemperature } = useAuth()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (rating > 0) {
      // 상대방에게 평가 점수 반영 (데모에서는 자신의 온도에 반영)
      updateTemperature(rating)
      setSubmitted(true)
      setTimeout(() => {
        onComplete()
      }, 1500)
    }
  }

  const displayRating = hoveredRating || rating

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose?.() }}>
      <DialogContent className="sm:max-w-md bg-background" showCloseButton={false}>
        <DialogTitle className="sr-only">상대방 평가</DialogTitle>
        <div className="py-4 text-center">
          {!submitted ? (
            <>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="닫기"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <h2 className="text-xl font-bold mb-2">상대방 평가</h2>
              <p className="text-muted-foreground mb-6">
                <span className="font-medium">{partnerNickname}</span>님과의 대화는 어땠나요?
              </p>

              {/* Star Rating */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= displayRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-transparent text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Rating Label */}
              <p className="text-sm text-muted-foreground mb-6 h-5">
                {displayRating > 0 ? RATING_LABELS[displayRating - 1] : "별점을 선택해주세요"}
              </p>

              <Button
                onClick={handleSubmit}
                disabled={rating === 0}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                평가 완료
              </Button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-green-600 fill-green-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">평가 완료!</h2>
              <p className="text-muted-foreground">평가가 상대방의 선명도에 반영되었습니다.</p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
