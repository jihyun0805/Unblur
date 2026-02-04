"use client"

import { useState } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { useRegisterForm } from "@/hooks/use-register-form"

const REGIONS = [
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "대전",
  "광주",
  "울산",
  "세종",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
]

interface RegisterStep2Props {
  formData: ReturnType<typeof useRegisterForm>["formData"]
  updateFormData: ReturnType<typeof useRegisterForm>["updateFormData"]
  onNext: () => void
  onPrev: () => void
}

export function RegisterStep2({ formData, updateFormData, onNext, onPrev }: RegisterStep2Props) {
  const [birthError, setBirthError] = useState("")
  const [birthInput, setBirthInput] = useState(() => {
    if (!formData.birthYear || !formData.birthMonth || !formData.birthDay) {
      return ""
    }
    return `${formData.birthYear.slice(-2)}${formData.birthMonth.padStart(2, "0")}${formData.birthDay.padStart(2, "0")}`
  })
  const normalizeBirthValue = (value: string) => value.replace(/\D/g, "").slice(0, 6)

  const getFullYear = (twoDigitYear: number) => {
    const currentYear = new Date().getFullYear()
    const cutoff = currentYear % 100
    return twoDigitYear <= cutoff ? 2000 + twoDigitYear : 1900 + twoDigitYear
  }

  const parseBirthInput = (input: string) => {
    const yy = Number.parseInt(input.slice(0, 2), 10)
    const mm = Number.parseInt(input.slice(2, 4), 10)
    const dd = Number.parseInt(input.slice(4, 6), 10)
    if (Number.isNaN(yy) || Number.isNaN(mm) || Number.isNaN(dd)) {
      return null
    }
    const year = getFullYear(yy)
    return { year, month: mm, day: dd }
  }

  const getBirthError = (input: string, allowPartial: boolean) => {
    if (!input) {
      return allowPartial ? "" : "생년월일 6자리를 입력해주세요."
    }

    if (input.length < 6) {
      return "생년월일 6자리를 입력해주세요."
    }

    const month = Number.parseInt(input.slice(2, 4), 10)
    if (Number.isNaN(month) || month < 1 || month > 12) {
      return "월은 1부터 12 사이여야 합니다."
    }

    const day = Number.parseInt(input.slice(4, 6), 10)
    if (Number.isNaN(day) || day < 1 || day > 31) {
      return "일은 1부터 31 사이여야 합니다."
    }

    const parsed = parseBirthInput(input)
    if (!parsed || parsed.year < 1900) {
      return "생년은 1900년 이후로 입력해주세요."
    }

    const date = new Date(parsed.year, parsed.month - 1, parsed.day)
    if (date.getFullYear() !== parsed.year || date.getMonth() !== parsed.month - 1 || date.getDate() !== parsed.day) {
      return "유효한 날짜를 입력해주세요."
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date > today) {
      return "미래 날짜는 입력할 수 없습니다."
    }

    return ""
  }

  const handleBirthChange = (value: string) => {
    const nextValue = normalizeBirthValue(value)
    setBirthInput(nextValue)
    const error = getBirthError(nextValue, true)
    setBirthError(error)

    if (nextValue.length === 6 && !error) {
      const parsed = parseBirthInput(nextValue)
      if (parsed) {
        updateFormData({
          birthYear: parsed.year.toString(),
          birthMonth: parsed.month.toString(),
          birthDay: parsed.day.toString(),
        })
      }
    } else {
      updateFormData({ birthYear: "", birthMonth: "", birthDay: "" })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errorMessage = getBirthError(birthInput, false)
    if (errorMessage) {
      setBirthError(errorMessage)
      return
    }
    const parsed = parseBirthInput(birthInput)
    if (parsed) {
      updateFormData({
        birthYear: parsed.year.toString(),
        birthMonth: parsed.month.toString(),
        birthDay: parsed.day.toString(),
      })
    }
    onNext()
  }
  const isStepComplete =
    birthInput.length === 6 &&
    !birthError &&
    !!formData.birthYear &&
    !!formData.birthMonth &&
    !!formData.birthDay &&
    !!formData.gender &&
    !!formData.region

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label>생년월일</Label>
        <Input
          id="birth_str"
          type="text"
          inputMode="numeric"
          placeholder="생년월일 6자리 (예: 980101)"
          value={birthInput}
          maxLength={6}
          onChange={(e) => handleBirthChange(e.target.value)}
        />
        {birthError ? <p className="text-sm text-destructive">{birthError}</p> : null}
      </div>
      <div className="space-y-2">
        <Label>성별</Label>
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant={formData.gender === "male" ? "default" : "outline"}
            onClick={() => updateFormData({ gender: "male" })}
            className={formData.gender === "male" ? "bg-primary text-primary-foreground" : ""}
          >
            남성
          </Button>
          <Button
            type="button"
            variant={formData.gender === "female" ? "default" : "outline"}
            onClick={() => updateFormData({ gender: "female" })}
            className={formData.gender === "female" ? "bg-primary text-primary-foreground" : ""}
          >
            여성
          </Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label>지역</Label>
        <Select value={formData.region} onValueChange={(value) => updateFormData({ region: value })}>
          <SelectTrigger className="bg-input">
            <SelectValue placeholder="지역을 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((region) => (
              <SelectItem key={region} value={region}>
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onPrev} className="flex-1">
          이전
        </Button>
        <Button
          type="submit"
          className={`flex-1 transition ${
            isStepComplete
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-primary/40 text-primary-foreground hover:bg-primary/50"
          }`}
        >
          다음
        </Button>
      </div>
    </form>
  )
}
