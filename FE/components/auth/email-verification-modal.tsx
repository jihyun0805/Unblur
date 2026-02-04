"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { confirmPasswordResetCode } from "@/lib/api/auth"

interface EmailVerificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  email: string
  onVerified?: (code: string) => void
}

export function EmailVerificationModal({ open, onOpenChange, email, onVerified }: EmailVerificationModalProps) {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const validateCode = (value: string) => /^\d{8}$/.test(value)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!code) {
      toast({
        title: "입력 오류",
        description: "인증 코드를 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    if (!validateCode(code)) {
      toast({
        title: "인증 코드 오류",
        description: "인증 코드는 숫자 8자리입니다.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await confirmPasswordResetCode(email, code)
      toast({
        title: "인증 완료",
        description: "새 비밀번호를 설정해주세요.",
      })
      onOpenChange(false)
      onVerified?.(code)
    } catch (error) {
      const message = error instanceof Error ? error.message : "인증에 실패했습니다."
      toast({
        title: "요청 실패",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setCode("")
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">이메일 인증</DialogTitle>
          <DialogDescription className="text-center">
            {email}로 전송된 인증 코드를 입력해주세요.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="verification-code">인증 코드</Label>
            <Input
              id="verification-code"
              type="text"
              placeholder="숫자 8자리"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="bg-input"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                처리 중...
              </>
            ) : (
              "인증 확인"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
