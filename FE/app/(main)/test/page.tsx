"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { MBTITestPage } from "@/components/mbti/mbti-test-page"

export default function MbtiRoutePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { updateUser, user } = useAuth()
  const autoStart = searchParams.get("start") === "1"

  return (
    <MBTITestPage
      onBack={() => router.push("/home")}
      existingMbti={user?.mbti}
      onViewResult={(mbti) => {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("mbtiResult", mbti)
        }
        router.push("/test/result")
      }}
      autoStart={autoStart}
      onComplete={(mbti) => {
        updateUser({ mbti })
        if (typeof window !== "undefined") {
          sessionStorage.setItem("mbtiResult", mbti)
        }
        router.push("/test/result")
      }}
    />
  )
}
