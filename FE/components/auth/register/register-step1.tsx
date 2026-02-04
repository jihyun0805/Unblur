"use client"

import { useState } from "react"
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
  showPasswordConfirm: boolean
  setShowPasswordConfirm: ReturnType<typeof useRegisterForm>["setShowPasswordConfirm"]
  emailAvailable: boolean | null
  checkingEmail: boolean
  nicknameAvailable: boolean | null
  checkingNickname: boolean
  passwordValidation: ReturnType<ReturnType<typeof useRegisterForm>["validatePassword"]>
  normalizePassword: ReturnType<typeof useRegisterForm>["normalizePassword"]
  validateEmail: ReturnType<typeof useRegisterForm>["validateEmail"]
  checkNickname: ReturnType<typeof useRegisterForm>["checkNickname"]
  checkEmail: ReturnType<typeof useRegisterForm>["checkEmail"]
  onNext: () => void
  onSwitchToLogin: () => void
}

export function RegisterStep1({
  formData,
  updateFormData,
  showPassword,
  setShowPassword,
  showPasswordConfirm,
  setShowPasswordConfirm,
  emailAvailable,
  checkingEmail,
  nicknameAvailable,
  checkingNickname,
  passwordValidation,
  normalizePassword,
  validateEmail,
  checkNickname,
  checkEmail,
  onNext,
  onSwitchToLogin,
}: RegisterStep1Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }
  const isEmailValid = formData.email ? validateEmail(formData.email) : true

  const NICKNAME_MAX_LENGTH = 10
  const normalizeNickname = (value: string) => {
    const withoutSpecial = value.replace(/[^\p{L}\p{N}]/gu, "")
    return withoutSpecial.slice(0, NICKNAME_MAX_LENGTH)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="nickname">닉네임</Label>
        <div className="flex gap-2">
          <Input
            id="nickname"
            placeholder="한글/영문/숫자만 사용 가능, 최대 10자"
            value={formData.nickname}
            onChange={(e) => {
              const newValue = normalizeNickname(e.target.value)
              updateFormData({ nickname: newValue })
            }}
            className="bg-input flex-1"
            maxLength={NICKNAME_MAX_LENGTH}
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
        <Label htmlFor="reg-email">이메일</Label>
        <div className="flex gap-2">
          <Input
            id="reg-email"
            type="email"
            placeholder="이메일을 입력하세요"
            value={formData.email}
            onChange={(e) => {
              const normalizedEmail = e.target.value.replace(/[^A-Za-z0-9@.]/g, "")
              updateFormData({ email: normalizedEmail })
            }}
            aria-invalid={!isEmailValid}
            className="bg-input flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={checkEmail}
            disabled={checkingEmail || !formData.email || !isEmailValid}
          >
            {checkingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : "중복확인"}
          </Button>
        </div>
        {!isEmailValid && (
          <p className="text-sm text-destructive">이메일 형식이 올바르지 않습니다.</p>
        )}
        {emailAvailable !== null && (
          <p className={`text-sm ${emailAvailable ? "text-green-600" : "text-destructive"}`}>
            {emailAvailable ? "사용 가능한 이메일입니다." : "이미 사용 중인 이메일입니다."}
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
            {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
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
            type={showPasswordConfirm ? "text" : "password"}
            placeholder="비밀번호를 다시 입력하세요"
            value={formData.passwordConfirm}
            onChange={(e) => updateFormData({ passwordConfirm: normalizePassword(e.target.value) })}
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
