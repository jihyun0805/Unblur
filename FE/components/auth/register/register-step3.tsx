"use client"

import type React from "react"
import { SURVEY_QUESTIONS } from "@/lib/survey-questions"
import type { useRegisterForm } from "@/hooks/use-register-form"
import { RegisterFormWrapper } from "./register-form-wrapper"
import { RadioGroupField } from "./radio-group-field"

interface RegisterStep3Props {
  formData: ReturnType<typeof useRegisterForm>["formData"]
  updateFormData: ReturnType<typeof useRegisterForm>["updateFormData"]
  onNext: () => void
  onPrev: () => void
}

export function RegisterStep3({ formData, updateFormData, onNext, onPrev }: RegisterStep3Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  return (
    <RegisterFormWrapper
      title="평소의 나는 어떤 사람인지 알려주세요!"
      description="매칭시에 사용되는 정보입니다. 타인에게는 노출되지 않습니다."
      onSubmit={handleSubmit}
      onPrev={onPrev}
    >
      <RadioGroupField
        label={SURVEY_QUESTIONS.dateStyle.question}
        value={formData.dateStyle}
        options={SURVEY_QUESTIONS.dateStyle.options}
        onChange={(value) => updateFormData({ dateStyle: value })}
        fieldId="dateStyle"
      />

      <RadioGroupField
        label={SURVEY_QUESTIONS.contactStyle.question}
        value={formData.contactStyle}
        options={SURVEY_QUESTIONS.contactStyle.options}
        onChange={(value) => updateFormData({ contactStyle: value })}
        fieldId="contactStyle"
      />

      <RadioGroupField
        label={SURVEY_QUESTIONS.conflictStyle.question}
        value={formData.conflictStyle}
        options={SURVEY_QUESTIONS.conflictStyle.options}
        onChange={(value) => updateFormData({ conflictStyle: value })}
        fieldId="conflictStyle"
      />

      <RadioGroupField
        label={SURVEY_QUESTIONS.spending.question}
        value={formData.spending}
        options={SURVEY_QUESTIONS.spending.options}
        onChange={(value) => updateFormData({ spending: value })}
        fieldId="spending"
      />
    </RegisterFormWrapper>
  )
}
