"use client"

import type React from "react"
import { SURVEY_QUESTIONS } from "@/lib/survey-questions"
import type { useRegisterForm } from "@/hooks/use-register-form"
import { RegisterFormWrapper } from "./register-form-wrapper"
import { RadioGroupField } from "./radio-group-field"

interface RegisterStep6Props {
  formData: ReturnType<typeof useRegisterForm>["formData"]
  updateFormData: ReturnType<typeof useRegisterForm>["updateFormData"]
  onNext: () => void
  onPrev: () => void
}

export function RegisterStep6({ formData, updateFormData, onNext, onPrev }: RegisterStep6Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  return (
    <RegisterFormWrapper
      title="매칭됐으면 하는 상대의 조건을 알려주세요!"
      description="매칭시에 사용되는 정보입니다. 타인에게는 노출되지 않습니다."
      onSubmit={handleSubmit}
      onPrev={onPrev}
    >
      <RadioGroupField
        label={SURVEY_QUESTIONS.smokingPartner.question}
        value={formData.smokingPartner}
        options={SURVEY_QUESTIONS.smokingPartner.options}
        onChange={(value) => updateFormData({ smokingPartner: value })}
        fieldId="smokingPartner"
      />

      <RadioGroupField
        label={SURVEY_QUESTIONS.drinkingPartner.question}
        value={formData.drinkingPartner}
        options={SURVEY_QUESTIONS.drinkingPartner.options}
        onChange={(value) => updateFormData({ drinkingPartner: value })}
        fieldId="drinkingPartner"
      />

      <RadioGroupField
        label={SURVEY_QUESTIONS.religionPartner.question}
        value={formData.religionPartner}
        options={SURVEY_QUESTIONS.religionPartner.options}
        onChange={(value) => updateFormData({ religionPartner: value })}
        fieldId="religionPartner"
      />

      <RadioGroupField
        label={SURVEY_QUESTIONS.petPartner.question}
        value={formData.petPartner}
        options={SURVEY_QUESTIONS.petPartner.options}
        onChange={(value) => updateFormData({ petPartner: value })}
        fieldId="petPartner"
      />
    </RegisterFormWrapper>
  )
}
