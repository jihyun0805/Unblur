"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
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
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 30 }, (_, i) => currentYear - 20 - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const days = Array.from({ length: 31 }, (_, i) => i + 1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onNext()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label>생년월일</Label>
        <div className="grid grid-cols-3 gap-2">
          <Select value={formData.birthYear} onValueChange={(value) => updateFormData({ birthYear: value })}>
            <SelectTrigger className="bg-input">
              <SelectValue placeholder="년" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}년
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={formData.birthMonth} onValueChange={(value) => updateFormData({ birthMonth: value })}>
            <SelectTrigger className="bg-input">
              <SelectValue placeholder="월" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month.toString()}>
                  {month}월
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={formData.birthDay} onValueChange={(value) => updateFormData({ birthDay: value })}>
            <SelectTrigger className="bg-input">
              <SelectValue placeholder="일" />
            </SelectTrigger>
            <SelectContent>
              {days.map((day) => (
                <SelectItem key={day} value={day.toString()}>
                  {day}일
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
        <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
          다음
        </Button>
      </div>
    </form>
  )
}
