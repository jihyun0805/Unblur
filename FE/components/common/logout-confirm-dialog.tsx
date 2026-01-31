"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface LogoutConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
}

export function LogoutConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: LogoutConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-background">
        <DialogHeader>
          <DialogTitle className="text-center">로그아웃</DialogTitle>
        </DialogHeader>
        <div className="py-4 text-center">
          <p className="mb-6">정말 로그아웃하시겠습니까?</p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              로그아웃
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
