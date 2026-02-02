"use client"

import type { ReactNode } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Heart } from "lucide-react"

interface ConfirmLeaveModalProps {
  open: boolean
  onConfirmLeave: () => void
  onContinue: () => void
  /** 기본: "상대방이 대화를 원해요!" (라운드 투표 그만하기 시 "정말 그만두시겠습니까?" 등으로 오버라이드) */
  title?: string
  /** 기본: 상대방 원해요 문구 (오버라이드 시 설명 문구) */
  description?: ReactNode
  /** 확인(나가기) 버튼 문구. 기본: "그래도 나갈게요" */
  confirmLabel?: string
  /** 취소(계속) 버튼 문구. 기본: "다시 생각해볼게요" */
  continueLabel?: string
}

export function ConfirmLeaveModal({
  open,
  onConfirmLeave,
  onContinue,
  title = "상대방이 대화를 원해요!",
  description = (
    <>
      상대방은 아직 대화를 계속하고 싶어해요.
      <br />
      정말 대화를 종료하시겠어요?
    </>
  ),
  confirmLabel = "그래도 나갈게요",
  continueLabel = "다시 생각해볼게요",
}: ConfirmLeaveModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md bg-background" showCloseButton={false}>
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="py-4 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">{title}</h2>
          <p className="text-muted-foreground mb-6">{description}</p>

          <div className="space-y-3">
            <Button onClick={onContinue} className="w-full py-6 bg-primary text-primary-foreground hover:bg-primary/90">
              <Heart className="w-5 h-5 mr-2" />
              {continueLabel}
            </Button>
            <Button variant="outline" onClick={onConfirmLeave} className="w-full py-6 bg-transparent">
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
