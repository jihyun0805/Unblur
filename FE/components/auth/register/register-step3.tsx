"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { SURVEY_QUESTIONS } from "@/lib/survey-questions"
import type { useRegisterForm } from "@/hooks/use-register-form"

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
    <form onSubmit={handleSubmit} className="space-y-10 mt-4">
      <div className="space-y-1">
        <h3 className="font-semibold text-center">평소의 나는 어떤 사람인지 알려주세요!</h3>
        <p className="text-sm text-muted-foreground text-center">매칭시에 사용되는 정보입니다. 타인에게는 노출되지 않습니다.</p>
      </div>

      <div className="space-y-3">
        <Label>{SURVEY_QUESTIONS.dateStyle.question}</Label>
        <RadioGroup
          value={formData.dateStyle}
          onValueChange={(value) => updateFormData({ dateStyle: value })}
          className="flex flex-wrap gap-5"
        >
          {SURVEY_QUESTIONS.dateStyle.options.map((opt) => (
            <label
              key={opt.value}
              htmlFor={`dateStyle-${opt.value}`}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <RadioGroupItem
                value={opt.value}
                id={`dateStyle-${opt.value}`}
                className="border-2 border-foreground/20 data-[state=checked]:border-primary"
              />
              <span className="text-sm font-normal">{opt.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label>{SURVEY_QUESTIONS.contactStyle.question}</Label>
        <RadioGroup
          value={formData.contactStyle}
          onValueChange={(value) => updateFormData({ contactStyle: value })}
          className="flex flex-wrap gap-5"
        >
          {SURVEY_QUESTIONS.contactStyle.options.map((opt) => (
            <label
              key={opt.value}
              htmlFor={`contactStyle-${opt.value}`}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <RadioGroupItem
                value={opt.value}
                id={`contactStyle-${opt.value}`}
                className="border-2 border-foreground/20 data-[state=checked]:border-primary"
              />
              <span className="text-sm font-normal">{opt.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label>{SURVEY_QUESTIONS.conflictStyle.question}</Label>
        <RadioGroup
          value={formData.conflictStyle}
          onValueChange={(value) => updateFormData({ conflictStyle: value })}
          className="flex flex-wrap gap-5"
        >
          {SURVEY_QUESTIONS.conflictStyle.options.map((opt) => (
            <label
              key={opt.value}
              htmlFor={`conflictStyle-${opt.value}`}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <RadioGroupItem
                value={opt.value}
                id={`conflictStyle-${opt.value}`}
                className="border-2 border-foreground/20 data-[state=checked]:border-primary"
              />
              <span className="text-sm font-normal">{opt.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label>{SURVEY_QUESTIONS.spending.question}</Label>
        <RadioGroup
          value={formData.spending}
          onValueChange={(value) => updateFormData({ spending: value })}
          className="flex flex-wrap gap-5"
        >
          {SURVEY_QUESTIONS.spending.options.map((opt) => (
            <label
              key={opt.value}
              htmlFor={`spending-${opt.value}`}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <RadioGroupItem
                value={opt.value}
                id={`spending-${opt.value}`}
                className="border-2 border-foreground/20 data-[state=checked]:border-primary"
              />
              <span className="text-sm font-normal">{opt.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onPrev} className="flex-1">
          이전
        </Button>
        <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
          다음
        </Button>
      </div>
    </form>
  )
}
