"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { SURVEY_QUESTIONS } from "@/lib/survey-questions"
import type { useRegisterForm } from "@/hooks/use-register-form"

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

  return (
    <form onSubmit={handleSubmit} className="space-y-10 mt-4">
      <div className="space-y-1">
        <h3 className="font-semibold text-center">나는 어떤 사람인지 알려주세요!</h3>
        <p className="text-sm text-muted-foreground text-center">매칭시에 사용되는 정보입니다. 타인에게는 노출되지 않습니다.</p>
      </div>

      <div className="space-y-3">
        <Label>{SURVEY_QUESTIONS.smokingSelf.question}</Label>
        <RadioGroup
          value={formData.smokingSelf}
          onValueChange={(value) => updateFormData({ smokingSelf: value })}
          className="flex flex-wrap gap-5"
        >
          {SURVEY_QUESTIONS.smokingSelf.options.map((opt) => (
            <label
              key={opt.value}
              htmlFor={`smokingSelf-${opt.value}`}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <RadioGroupItem
                value={opt.value}
                id={`smokingSelf-${opt.value}`}
                className="border-2 border-foreground/20 data-[state=checked]:border-primary"
              />
              <span className="text-sm font-normal">{opt.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label>{SURVEY_QUESTIONS.drinkingSelf.question}</Label>
        <RadioGroup
          value={formData.drinkingSelf}
          onValueChange={(value) => updateFormData({ drinkingSelf: value })}
          className="flex flex-wrap gap-5"
        >
          {SURVEY_QUESTIONS.drinkingSelf.options.map((opt) => (
            <label
              key={opt.value}
              htmlFor={`drinkingSelf-${opt.value}`}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <RadioGroupItem
                value={opt.value}
                id={`drinkingSelf-${opt.value}`}
                className="border-2 border-foreground/20 data-[state=checked]:border-primary"
              />
              <span className="text-sm font-normal">{opt.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label>{SURVEY_QUESTIONS.religionSelf.question}</Label>
        <RadioGroup
          value={formData.religionSelf}
          onValueChange={(value) => updateFormData({ religionSelf: value })}
          className="flex flex-wrap gap-5"
        >
          {SURVEY_QUESTIONS.religionSelf.options.map((opt) => (
            <label
              key={opt.value}
              htmlFor={`religionSelf-${opt.value}`}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <RadioGroupItem
                value={opt.value}
                id={`religionSelf-${opt.value}`}
                className="border-2 border-foreground/20 data-[state=checked]:border-primary"
              />
              <span className="text-sm font-normal">{opt.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label>{SURVEY_QUESTIONS.petSelf.question}</Label>
        <RadioGroup
          value={formData.petSelf}
          onValueChange={(value) => updateFormData({ petSelf: value })}
          className="flex flex-wrap gap-5"
        >
          {SURVEY_QUESTIONS.petSelf.options.map((opt) => (
            <label
              key={opt.value}
              htmlFor={`petSelf-${opt.value}`}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <RadioGroupItem
                value={opt.value}
                id={`petSelf-${opt.value}`}
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
