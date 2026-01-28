"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { MBTITestPage } from "@/components/mbti/mbti-test-page"

export default function MbtiRoutePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const autoStart = searchParams.get("start") === "1"

  return (
    <MBTITestPage
      onBack={() => router.push("/home")}
      existingMbti={user?.mbti}
      onViewResult={(mbti) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("loveTestResult", mbti)
          sessionStorage.setItem("loveTestResult", mbti)
        }
        router.push("/test/result")
      }}
      autoStart={autoStart}
      onComplete={(mbti) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("loveTestResult", mbti)
          sessionStorage.setItem("loveTestResult", mbti)
        }
        router.push("/test/result")
      }}
    />
  )
}
