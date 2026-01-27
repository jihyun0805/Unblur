"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react"
import type { useRegisterForm } from "@/hooks/use-register-form"

interface RegisterStep1Props {
  formData: ReturnType<typeof useRegisterForm>["formData"]
  updateFormData: ReturnType<typeof useRegisterForm>["updateFormData"]
  showPassword: boolean
  setShowPassword: ReturnType<typeof useRegisterForm>["setShowPassword"]
  usernameAvailable: boolean | null
  checkingUsername: boolean
  nicknameAvailable: boolean | null
  checkingNickname: boolean
  passwordValidation: ReturnType<ReturnType<typeof useRegisterForm>["validatePassword"]>
  normalizeUsername: ReturnType<typeof useRegisterForm>["normalizeUsername"]
  normalizePassword: ReturnType<typeof useRegisterForm>["normalizePassword"]
  checkNickname: ReturnType<typeof useRegisterForm>["checkNickname"]
  checkUsername: ReturnType<typeof useRegisterForm>["checkUsername"]
  onNext: () => void
  onSwitchToLogin: () => void
}

export function RegisterStep1({
  formData,
  updateFormData,
  showPassword,
  setShowPassword,
  usernameAvailable,
  checkingUsername,
  nicknameAvailable,
  checkingNickname,
  passwordValidation,
  normalizeUsername,
  normalizePassword,
  checkNickname,
  checkUsername,
  onNext,
  onSwitchToLogin,
}: RegisterStep1Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="nickname">닉네임</Label>
        <div className="flex gap-2">
          <Input
            id="nickname"
            placeholder="소개팅에서 사용할 닉네임"
            value={formData.nickname}
            onChange={(e) => {
              updateFormData({ nickname: e.target.value })
            }}
            className="bg-input flex-1"
          />
          <Button type="button" variant="outline" onClick={checkNickname} disabled={checkingNickname}>
            {checkingNickname ? <Loader2 className="w-4 h-4 animate-spin" /> : "중복확인"}
          </Button>
        </div>
        {nicknameAvailable !== null && (
          <p className={`text-sm ${nicknameAvailable ? "text-green-600" : "text-destructive"}`}>
            {nicknameAvailable ? "사용 가능한 닉네임입니다." : "이미 사용 중인 닉네임입니다."}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-username">아이디</Label>
        <div className="flex gap-2">
          <Input
            id="reg-username"
            placeholder="4~16자"
            value={formData.username}
            onChange={(e) => {
              const nextValue = normalizeUsername(e.target.value)
              updateFormData({ username: nextValue })
            }}
            className="bg-input flex-1"
            maxLength={16}
          />
          <Button type="button" variant="outline" onClick={checkUsername} disabled={checkingUsername}>
            {checkingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : "중복확인"}
          </Button>
        </div>
        {usernameAvailable !== null && (
          <p className={`text-sm ${usernameAvailable ? "text-green-600" : "text-destructive"}`}>
            {usernameAvailable ? "사용 가능한 아이디입니다." : "이미 사용 중인 아이디입니다."}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-password">비밀번호</Label>
        <div className="relative">
          <Input
            id="reg-password"
            type={showPassword ? "text" : "password"}
            placeholder="9~16자, 영문+숫자+특수문자(!*^?_)"
            value={formData.password}
            onChange={(e) => updateFormData({ password: normalizePassword(e.target.value) })}
            className="bg-input pr-10"
            maxLength={16}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {formData.password && (
          <div className="flex flex-wrap gap-2 text-xs">
            <span
              className={`flex items-center gap-1 ${passwordValidation.isValidLength ? "text-green-600" : "text-muted-foreground"}`}
            >
              {passwordValidation.isValidLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} 9~16자
            </span>
            <span
              className={`flex items-center gap-1 ${passwordValidation.hasLetter ? "text-green-600" : "text-muted-foreground"}`}
            >
              {passwordValidation.hasLetter ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} 영문
            </span>
            <span
              className={`flex items-center gap-1 ${passwordValidation.hasNumber ? "text-green-600" : "text-muted-foreground"}`}
            >
              {passwordValidation.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} 숫자
            </span>
            <span
              className={`flex items-center gap-1 ${passwordValidation.hasSpecial ? "text-green-600" : "text-muted-foreground"}`}
            >
              {passwordValidation.hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} 특수문자(!*^?_)
            </span>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password-confirm">비밀번호 확인</Label>
        <div className="relative">
          <Input
            id="password-confirm"
            type={showPassword ? "text" : "password"}
            placeholder="비밀번호를 다시 입력하세요"
            value={formData.passwordConfirm}
            onChange={(e) => updateFormData({ passwordConfirm: normalizePassword(e.target.value) })}
            className="bg-input pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {formData.passwordConfirm && formData.password !== formData.passwordConfirm && (
          <p className="text-sm text-destructive">비밀번호가 일치하지 않습니다.</p>
        )}
      </div>
      <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
        다음
      </Button>
      <div className="text-center text-sm text-muted-foreground">
        이미 계정이 있으신가요?{" "}
        <button type="button" onClick={onSwitchToLogin} className="text-foreground font-medium hover:underline">
          로그인
        </button>
      </div>
    </form>
  )
}
