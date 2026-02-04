"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Heart } from "lucide-react"

interface EndCallConfirmModalProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function EndCallConfirmModal({ open, onConfirm, onCancel }: EndCallConfirmModalProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md bg-background" showCloseButton={false}>
        <DialogTitle className="sr-only">대화 종료 확인</DialogTitle>
        <div className="py-4 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">세션을 나가시겠습니까?</h2>
          <p className="text-muted-foreground mb-6">나가시면 홈으로 이동합니다.</p>

          <div className="space-y-3">
            <Button onClick={onCancel} className="w-full py-6 bg-primary text-primary-foreground hover:bg-primary/90">
              <Heart className="w-5 h-5 mr-2" />
              좀 더 얘기해볼게요
            </Button>
            <Button variant="outline" onClick={onConfirm} className="w-full py-6 bg-transparent">
              그래도 나갈게요
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
