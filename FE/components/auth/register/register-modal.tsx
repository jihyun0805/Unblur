"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useRegisterForm } from "@/hooks/use-register-form"
import { StepProgress } from "./step-progress"
import { RegisterStep1 } from "./register-step1"
import { RegisterStep2 } from "./register-step2"
import { RegisterStep3 } from "./register-step3"
import { RegisterStep4 } from "./register-step4"
import { RegisterStep5 } from "./register-step5"
import { RegisterStep6 } from "./register-step6"
import { RegisterStep7 } from "./register-step7"
import { RegisterStep8 } from "./register-step8"

interface RegisterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToLogin: () => void
}

const TOTAL_STEPS = 8

export function RegisterModal({ open, onOpenChange, onSwitchToLogin }: RegisterModalProps) {
  const [step, setStep] = useState(1)
  const {
    formData,
    updateFormData,
    resetForm,
    showPassword,
    setShowPassword,
    isLoading,
    emailAvailable,
    checkingEmail,
    nicknameAvailable,
    checkingNickname,
    validatePassword,
    normalizePassword,
    validateEmail,
    checkNickname,
    checkEmail,
    calculateAge,
    submitRegistration,
  } = useRegisterForm()
  const { toast } = useToast()

  const passwordValidation = validatePassword(formData.password)

  const validateStep1 = () => {
    if (!formData.nickname || !formData.email || !formData.password) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      })
      return false
    }

    if (nicknameAvailable !== true) {
      toast({
        title: "닉네임 확인 필요",
        description: "닉네임 중복 확인을 해주세요.",
        variant: "destructive",
      })
      return false
    }

    if (!validateEmail(formData.email)) {
      toast({
        title: "이메일 형식 오류",
        description: "올바른 이메일 형식을 입력해주세요.",
        variant: "destructive",
      })
      return false
    }

    if (emailAvailable !== true) {
      toast({
        title: "이메일 확인 필요",
        description: "이메일 중복 확인을 해주세요.",
        variant: "destructive",
      })
      return false
    }

    if (!passwordValidation.isValid) {
      toast({
        title: "비밀번호 오류",
        description: "9~16자, 영문+숫자+특수문자(!*^?_) 조건을 확인해주세요.",
        variant: "destructive",
      })
      return false
    }

    if (formData.password !== formData.passwordConfirm) {
      toast({
        title: "비밀번호 오류",
        description: "비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const validateStep2 = () => {
    if (!formData.birthYear || !formData.birthMonth || !formData.birthDay || !formData.gender || !formData.region) {
      toast({
        title: "입력 오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const validateStep3 = () => {
    if (!formData.dateStyle || !formData.contactStyle || !formData.conflictStyle || !formData.spending) {
      toast({
        title: "입력 오류",
        description: "모든 질문에 답변해주세요.",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const validateStep4 = () => {
    if (!formData.priority || formData.agePreference.length === 0 || !formData.distancePreference) {
      toast({
        title: "입력 오류",
        description: "모든 질문에 답변해주세요.",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const validateStep5 = () => {
    if (!formData.smokingSelf || !formData.drinkingSelf || !formData.religionSelf || !formData.petSelf) {
      toast({
        title: "입력 오류",
        description: "모든 질문에 답변해주세요.",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const validateStep6 = () => {
    if (!formData.smokingPartner || !formData.drinkingPartner || !formData.religionPartner || !formData.petPartner) {
      toast({
        title: "입력 오류",
        description: "모든 질문에 답변해주세요.",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const validateStep7 = () => {
    if (formData.interests.length === 0) {
      toast({
        title: "입력 오류",
        description: "관심사를 최소 1개 이상 선택해주세요.",
        variant: "destructive",
      })
      return false
    }
    return true
  }

  const validateStep8 = () => {
    // MBTI와 한줄소개는 선택사항이므로 검증 불필요
    return true
  }

  const handleNext = () => {
    let isValid = false

    switch (step) {
      case 1:
        isValid = validateStep1()
        break
      case 2:
        isValid = validateStep2()
        break
      case 3:
        isValid = validateStep3()
        break
      case 4:
        isValid = validateStep4()
        break
      case 5:
        isValid = validateStep5()
        break
      case 6:
        isValid = validateStep6()
        break
      case 7:
        isValid = validateStep7()
        break
      case 8:
        isValid = validateStep8()
        break
    }

    if (isValid && step < TOTAL_STEPS) {
      setStep(step + 1)
    }
  }

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleStep8Submit = async () => {
    if (!validateStep8()) {
      return
    }

    const success = await submitRegistration()

    if (success) {
      toast({
        title: "회원가입 완료",
        description: "로그인 화면으로 이동합니다.",
      })
      onOpenChange(false)
      setStep(1)
      resetForm()
      onSwitchToLogin()
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep(1)
      resetForm()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg bg-background max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">회원가입</DialogTitle>
          <StepProgress currentStep={step} totalSteps={TOTAL_STEPS} />
        </DialogHeader>

        {step === 1 && (
          <RegisterStep1
            formData={formData}
            updateFormData={updateFormData}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            emailAvailable={emailAvailable}
            checkingEmail={checkingEmail}
            nicknameAvailable={nicknameAvailable}
            checkingNickname={checkingNickname}
            passwordValidation={passwordValidation}
            normalizePassword={normalizePassword}
            checkNickname={checkNickname}
            checkEmail={checkEmail}
            onNext={handleNext}
            onSwitchToLogin={onSwitchToLogin}
          />
        )}

        {step === 2 && (
          <RegisterStep2 formData={formData} updateFormData={updateFormData} onNext={handleNext} onPrev={handlePrev} />
        )}

        {step === 3 && (
          <RegisterStep3 formData={formData} updateFormData={updateFormData} onNext={handleNext} onPrev={handlePrev} />
        )}

        {step === 4 && (
          <RegisterStep4 formData={formData} updateFormData={updateFormData} onNext={handleNext} onPrev={handlePrev} />
        )}

        {step === 5 && (
          <RegisterStep5 formData={formData} updateFormData={updateFormData} onNext={handleNext} onPrev={handlePrev} />
        )}

        {step === 6 && (
          <RegisterStep6 formData={formData} updateFormData={updateFormData} onNext={handleNext} onPrev={handlePrev} />
        )}

        {step === 7 && (
          <RegisterStep7 formData={formData} updateFormData={updateFormData} onNext={handleNext} onPrev={handlePrev} />
        )}

        {step === 8 && (
          <RegisterStep8
            formData={formData}
            updateFormData={updateFormData}
            isLoading={isLoading}
            onPrev={handlePrev}
            onSubmit={handleStep8Submit}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
