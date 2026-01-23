"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { SURVEY_QUESTIONS } from "@/lib/survey-questions"
import type { useRegisterForm } from "@/hooks/use-register-form"

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
    <form onSubmit={handleSubmit} className="space-y-10 mt-4">
      <div className="space-y-1">
        <h3 className="font-semibold text-center">매칭됐으면 하는 상대의 조건을 알려주세요!</h3>
        <p className="text-sm text-muted-foreground text-center">매칭시에 사용되는 정보입니다. 타인에게는 노출되지 않습니다.</p>
      </div>

      <div className="space-y-3">
        <Label>{SURVEY_QUESTIONS.smokingPartner.question}</Label>
        <RadioGroup
          value={formData.smokingPartner}
          onValueChange={(value) => updateFormData({ smokingPartner: value })}
          className="flex flex-wrap gap-5"
        >
          {SURVEY_QUESTIONS.smokingPartner.options.map((opt) => (
            <label
              key={opt.value}
              htmlFor={`smokingPartner-${opt.value}`}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <RadioGroupItem
                value={opt.value}
                id={`smokingPartner-${opt.value}`}
                className="border-2 border-foreground/20 data-[state=checked]:border-primary"
              />
              <span className="text-sm font-normal">{opt.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label>{SURVEY_QUESTIONS.drinkingPartner.question}</Label>
        <RadioGroup
          value={formData.drinkingPartner}
          onValueChange={(value) => updateFormData({ drinkingPartner: value })}
          className="flex flex-wrap gap-5"
        >
          {SURVEY_QUESTIONS.drinkingPartner.options.map((opt) => (
            <label
              key={opt.value}
              htmlFor={`drinkingPartner-${opt.value}`}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <RadioGroupItem
                value={opt.value}
                id={`drinkingPartner-${opt.value}`}
                className="border-2 border-foreground/20 data-[state=checked]:border-primary"
              />
              <span className="text-sm font-normal">{opt.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label>{SURVEY_QUESTIONS.religionPartner.question}</Label>
        <RadioGroup
          value={formData.religionPartner}
          onValueChange={(value) => updateFormData({ religionPartner: value })}
          className="flex flex-wrap gap-5"
        >
          {SURVEY_QUESTIONS.religionPartner.options.map((opt) => (
            <label
              key={opt.value}
              htmlFor={`religionPartner-${opt.value}`}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <RadioGroupItem
                value={opt.value}
                id={`religionPartner-${opt.value}`}
                className="border-2 border-foreground/20 data-[state=checked]:border-primary"
              />
              <span className="text-sm font-normal">{opt.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label>{SURVEY_QUESTIONS.petPartner.question}</Label>
        <RadioGroup
          value={formData.petPartner}
          onValueChange={(value) => updateFormData({ petPartner: value })}
          className="flex flex-wrap gap-5"
        >
          {SURVEY_QUESTIONS.petPartner.options.map((opt) => (
            <label
              key={opt.value}
              htmlFor={`petPartner-${opt.value}`}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <RadioGroupItem
                value={opt.value}
                id={`petPartner-${opt.value}`}
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
