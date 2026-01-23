"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Heart } from "lucide-react"

interface ConfirmLeaveModalProps {
  open: boolean
  onConfirmLeave: () => void
  onContinue: () => void
}

export function ConfirmLeaveModal({ open, onConfirmLeave, onContinue }: ConfirmLeaveModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md bg-background" showCloseButton={false}>
        <DialogTitle className="sr-only">상대방이 대화를 원해요</DialogTitle>
        <div className="py-4 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">상대방이 대화를 원해요!</h2>
          <p className="text-muted-foreground mb-6">
            상대방은 아직 대화를 계속하고 싶어해요.
            <br />
            정말 대화를 종료하시겠어요?
          </p>

          <div className="space-y-3">
            <Button onClick={onContinue} className="w-full py-6 bg-primary text-primary-foreground hover:bg-primary/90">
              <Heart className="w-5 h-5 mr-2" />
              다시 생각해볼게요
            </Button>
            <Button variant="outline" onClick={onConfirmLeave} className="w-full py-6 bg-transparent">
              그래도 나갈게요
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
