"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { resetPassword } from "@/lib/api/auth"

interface PasswordResetChangeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  email: string
  code: string
  onComplete?: () => void
}

export function PasswordResetChangeModal({
  open,
  onOpenChange,
  email,
  code,
  onComplete,
}: PasswordResetChangeModalProps) {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const validatePassword = (value: string) =>
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{9,16}$/.test(value)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!code) {
      toast({
        title: "인증 오류",
        description: "인증 코드가 없습니다. 다시 인증해주세요.",
        variant: "destructive",
      })
      return
    }

    if (!newPassword || !confirmPassword) {
      toast({
        title: "입력 오류",
        description: "모든 항목을 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    if (!validatePassword(newPassword)) {
      toast({
        title: "비밀번호 오류",
        description: "9~16자 영문+숫자+특수문자 조합으로 입력해주세요.",
        variant: "destructive",
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "비밀번호 오류",
        description: "비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await resetPassword(email, code, newPassword)
      toast({
        title: "비밀번호 변경 완료",
        description: "새 비밀번호로 로그인해주세요.",
      })
      onOpenChange(false)
      onComplete?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : "비밀번호 재설정에 실패했습니다."
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
      setNewPassword("")
      setConfirmPassword("")
      setShowPassword(false)
      setShowPasswordConfirm(false)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">비밀번호 재설정</DialogTitle>
          <DialogDescription className="text-center">
            새 비밀번호를 입력해주세요.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">새 비밀번호</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="새 비밀번호를 입력하세요"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showPasswordConfirm ? "text" : "password"}
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPasswordConfirm ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
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
              "비밀번호 변경"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
