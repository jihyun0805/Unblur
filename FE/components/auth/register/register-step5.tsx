"use client"

import type React from "react"
import { SURVEY_QUESTIONS } from "@/lib/survey-questions"
import type { useRegisterForm } from "@/hooks/use-register-form"
import { RegisterFormWrapper } from "./register-form-wrapper"
import { RadioGroupField } from "./radio-group-field"

interface RegisterStep5Props {
  formData: ReturnType<typeof useRegisterForm>["formData"]
  updateFormData: ReturnType<typeof useRegisterForm>["updateFormData"]
  onNext: () => void
  onPrev: () => void
}

export function RegisterStep5({ formData, updateFormData, onNext, onPrev }: RegisterStep5Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }
  const isStepComplete = Boolean(
    formData.smokingSelf && formData.drinkingSelf && formData.religionSelf && formData.petSelf
  )

  return (
    <RegisterFormWrapper
      title="나는 어떤 사람인지 알려주세요!"
      description="매칭시에 사용되는 정보입니다. 타인에게는 노출되지 않습니다."
      onSubmit={handleSubmit}
      onPrev={onPrev}
      submitEmphasized={isStepComplete}
    >
      <RadioGroupField
        label={SURVEY_QUESTIONS.smokingSelf.question}
        value={formData.smokingSelf}
        options={SURVEY_QUESTIONS.smokingSelf.options}
        onChange={(value) => updateFormData({ smokingSelf: value })}
        fieldId="smokingSelf"
      />

      <RadioGroupField
        label={SURVEY_QUESTIONS.drinkingSelf.question}
        value={formData.drinkingSelf}
        options={SURVEY_QUESTIONS.drinkingSelf.options}
        onChange={(value) => updateFormData({ drinkingSelf: value })}
        fieldId="drinkingSelf"
      />

      <RadioGroupField
        label={SURVEY_QUESTIONS.religionSelf.question}
        value={formData.religionSelf}
        options={SURVEY_QUESTIONS.religionSelf.options}
        onChange={(value) => updateFormData({ religionSelf: value })}
        fieldId="religionSelf"
      />

      <RadioGroupField
        label={SURVEY_QUESTIONS.petSelf.question}
        value={formData.petSelf}
        options={SURVEY_QUESTIONS.petSelf.options}
        onChange={(value) => updateFormData({ petSelf: value })}
        fieldId="petSelf"
      />
    </RegisterFormWrapper>
  )
}
