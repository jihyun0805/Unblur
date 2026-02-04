"use client"

import type React from "react"
import { SURVEY_QUESTIONS } from "@/lib/survey-questions"
import type { useRegisterForm } from "@/hooks/use-register-form"
import { RegisterFormWrapper } from "./register-form-wrapper"
import { CheckboxGroupField } from "./checkbox-group-field"

interface RegisterStep7Props {
  formData: ReturnType<typeof useRegisterForm>["formData"]
  updateFormData: ReturnType<typeof useRegisterForm>["updateFormData"]
  onNext: () => void
  onPrev: () => void
}

export function RegisterStep7({ formData, updateFormData, onNext, onPrev }: RegisterStep7Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }
  const isStepComplete = formData.interests.length > 0

  return (
    <RegisterFormWrapper
      title="내가 어떤 사람인지 소개할 수 있는 태그를 알려주세요!"
      description="프로필 조회시 노출되는 정보입니다. 마이페이지에서 수정 가능합니다."
      onSubmit={handleSubmit}
      onPrev={onPrev}
      className="space-y-4 mt-4"
      submitEmphasized={isStepComplete}
    >
      <CheckboxGroupField
        label={SURVEY_QUESTIONS.interests.question}
        values={formData.interests}
        options={SURVEY_QUESTIONS.interests.options}
        onChange={(values) => updateFormData({ interests: values })}
        fieldId="interest"
        maxSelection={5}
        showCount={true}
        gridCols={2}
        className="grid grid-cols-2 gap-2"
      />
    </RegisterFormWrapper>
  )
}
