"use client"

import type React from "react"
import { SURVEY_QUESTIONS } from "@/lib/survey-questions"
import type { useRegisterForm } from "@/hooks/use-register-form"
import { RegisterFormWrapper } from "./register-form-wrapper"
import { RadioGroupField } from "./radio-group-field"
import { CheckboxGroupField } from "./checkbox-group-field"

interface RegisterStep4Props {
  formData: ReturnType<typeof useRegisterForm>["formData"]
  updateFormData: ReturnType<typeof useRegisterForm>["updateFormData"]
  onNext: () => void
  onPrev: () => void
}

export function RegisterStep4({ formData, updateFormData, onNext, onPrev }: RegisterStep4Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }
  const isStepComplete = Boolean(
    formData.priority && formData.agePreference.length > 0 && formData.distancePreference
  )

  return (
    <RegisterFormWrapper
      title="매칭됐으면 하는 상대의 조건을 알려주세요!"
      description="매칭시에 사용되는 정보입니다. 타인에게는 노출되지 않습니다."
      onSubmit={handleSubmit}
      onPrev={onPrev}
      submitEmphasized={isStepComplete}
    >
      <RadioGroupField
        label={SURVEY_QUESTIONS.priority.question}
        value={formData.priority}
        options={SURVEY_QUESTIONS.priority.options}
        onChange={(value) => updateFormData({ priority: value })}
        fieldId="priority"
      />

      <CheckboxGroupField
        label={SURVEY_QUESTIONS.agePreference.question}
        values={formData.agePreference}
        options={SURVEY_QUESTIONS.agePreference.options}
        onChange={(values) => updateFormData({ agePreference: values })}
        fieldId="age"
      />

      <RadioGroupField
        label={SURVEY_QUESTIONS.distancePreference.question}
        value={formData.distancePreference}
        options={SURVEY_QUESTIONS.distancePreference.options}
        onChange={(value) => updateFormData({ distancePreference: value })}
        fieldId="distancePreference"
      />
    </RegisterFormWrapper>
  )
}
