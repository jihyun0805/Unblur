"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2 } from "lucide-react"
import type { useRegisterForm } from "@/hooks/use-register-form"

interface RegisterStep8Props {
  formData: ReturnType<typeof useRegisterForm>["formData"]
  updateFormData: ReturnType<typeof useRegisterForm>["updateFormData"]
  isLoading: boolean
  onPrev: () => void
  onSubmit: () => void
}

const MBTI_TYPES = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
]

export function RegisterStep8({ formData, updateFormData, isLoading, onPrev, onSubmit }: RegisterStep8Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      <div className="space-y-1">
        <h3 className="font-semibold text-center">나를 더 잘 표현해주세요!</h3>
        <p className="text-sm text-muted-foreground text-center">입력하지 않아도 가입 가능합니다</p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="mbti">MBTI</Label>
        <RadioGroup
          value={formData.mbti}
          onValueChange={(value) => updateFormData({ mbti: value })}
          className="grid grid-cols-4 gap-2"
        >
          {MBTI_TYPES.map((mbti) => (
            <label
              key={mbti}
              htmlFor={`mbti-${mbti}`}
              className={`flex items-center justify-center space-x-2 cursor-pointer border rounded-md p-2 hover:bg-accent transition-colors ${
                formData.mbti === mbti ? "border-primary bg-accent" : ""
              }`}
            >
              <RadioGroupItem
                value={mbti}
                id={`mbti-${mbti}`}
                className="border-2 border-foreground/20 data-[state=checked]:border-primary"
              />
              <span className="text-sm font-medium">{mbti}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">한줄 소개</Label>
        <Input
          id="bio"
          placeholder="나를 한 줄로 소개해주세요 (예: 커피를 좋아하는 개발자입니다)"
          value={formData.bio}
          onChange={(e) => updateFormData({ bio: e.target.value })}
          className="bg-input"
          maxLength={50}
        />
        <p className="text-xs text-muted-foreground">{formData.bio.length}/50</p>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onPrev} className="flex-1">
          이전
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              가입 중...
            </>
          ) : (
            "가입하기"
          )}
        </Button>
      </div>
    </form>
  )
}
