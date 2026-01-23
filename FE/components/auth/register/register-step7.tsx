"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { SURVEY_QUESTIONS } from "@/lib/survey-questions"
import type { useRegisterForm } from "@/hooks/use-register-form"

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-1">
        <h3 className="font-semibold text-center">내가 어떤 사람인지 소개할 수 있는 태그를 알려주세요!</h3>
        <p className="text-sm text-muted-foreground text-center">프로필 조회시 노출되는 정보입니다. 마이페이지에서 수정 가능합니다.</p>
      </div>

      <div className="space-y-2">
        <Label>{SURVEY_QUESTIONS.interests.question} (최대 5개)</Label>
        <div className="grid grid-cols-2 gap-2">
          {SURVEY_QUESTIONS.interests.options.map((opt) => (
            <div key={opt.value} className="flex items-center space-x-2">
              <Checkbox
                id={`interest-${opt.value}`}
                checked={formData.interests.includes(opt.value)}
                onCheckedChange={() => {
                  if (formData.interests.includes(opt.value)) {
                    updateFormData({
                      interests: formData.interests.filter((i) => i !== opt.value),
                    })
                  } else if (formData.interests.length < 5) {
                    updateFormData({
                      interests: [...formData.interests, opt.value],
                    })
                  }
                }}
                disabled={!formData.interests.includes(opt.value) && formData.interests.length >= 5}
                className="border-2 border-foreground/30 data-[state=checked]:border-primary"
              />
              <label htmlFor={`interest-${opt.value}`} className="text-sm cursor-pointer">
                {opt.label}
              </label>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{formData.interests.length}/5 선택됨</p>
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
