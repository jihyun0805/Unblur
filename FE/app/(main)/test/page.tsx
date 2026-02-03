"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { updateLoveDna } from "@/lib/api/user"
import { MBTITestPage } from "@/components/mbti/mbti-test-page"

export default function MbtiRoutePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, updateUser } = useAuth()
  const autoStart = searchParams.get("start") === "1"

  return (
    <MBTITestPage
      onBack={() => router.push("/home")}
      existingMbti={user?.loveDna}
      onViewResult={(mbti) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("loveTestResult", mbti)
          sessionStorage.setItem("loveTestResult", mbti)
        }
        router.push("/test/result")
      }}
      autoStart={autoStart}
      onComplete={async (mbti) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("loveTestResult", mbti)
          sessionStorage.setItem("loveTestResult", mbti)
        }
        try {
          const updated = await updateLoveDna(mbti)
          updateUser({ loveDna: updated.loveDna })
        } catch (error) {
          console.error("연애 성향 유형 저장 실패:", error)
        }
        router.push("/test/result")
      }}
    />
  )
}
