"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { SURVEY_QUESTIONS } from "@/lib/survey-questions"
import type { useRegisterForm } from "@/hooks/use-register-form"

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

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter((i) => i !== item)
    }
    return [...array, item]
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10 mt-4">
      <div className="space-y-1">
        <h3 className="font-semibold text-center">매칭됐으면 하는 상대의 조건을 알려주세요!</h3>
        <p className="text-sm text-muted-foreground text-center">매칭시에 사용되는 정보입니다. 타인에게는 노출되지 않습니다.</p>
      </div>

      <div className="space-y-3">
        <Label>{SURVEY_QUESTIONS.priority.question}</Label>
        <RadioGroup
          value={formData.priority}
          onValueChange={(value) => updateFormData({ priority: value })}
          className="flex flex-wrap gap-5"
        >
          {SURVEY_QUESTIONS.priority.options.map((opt) => (
            <label
              key={opt.value}
              htmlFor={`priority-${opt.value}`}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <RadioGroupItem
                value={opt.value}
                id={`priority-${opt.value}`}
                className="border-2 border-foreground/20 data-[state=checked]:border-primary"
              />
              <span className="text-sm font-normal">{opt.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label>{SURVEY_QUESTIONS.agePreference.question}</Label>
        <div className="flex flex-wrap gap-5">
          {SURVEY_QUESTIONS.agePreference.options.map((opt) => (
            <label
              key={opt.value}
              htmlFor={`age-${opt.value}`}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <Checkbox
                id={`age-${opt.value}`}
                checked={formData.agePreference.includes(opt.value)}
                onCheckedChange={() =>
                  updateFormData({
                    agePreference: toggleArrayItem(formData.agePreference, opt.value),
                  })
                }
                className="rounded-full border-2 border-foreground/20 data-[state=checked]:border-primary size-4 data-[state=checked]:bg-transparent [&>svg]:hidden data-[state=checked]:after:content-[''] data-[state=checked]:after:absolute data-[state=checked]:after:top-1/2 data-[state=checked]:after:left-1/2 data-[state=checked]:after:-translate-x-1/2 data-[state=checked]:after:-translate-y-1/2 data-[state=checked]:after:w-2 data-[state=checked]:after:h-2 data-[state=checked]:after:rounded-full data-[state=checked]:after:bg-primary relative"
              />
              <span className="text-sm font-normal">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>{SURVEY_QUESTIONS.distancePreference.question}</Label>
        <RadioGroup
          value={formData.distancePreference}
          onValueChange={(value) => updateFormData({ distancePreference: value })}
          className="flex flex-wrap gap-5"
        >
          {SURVEY_QUESTIONS.distancePreference.options.map((opt) => (
            <label
              key={opt.value}
              htmlFor={`distancePreference-${opt.value}`}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <RadioGroupItem
                value={opt.value}
                id={`distancePreference-${opt.value}`}
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
