"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { MBTITestPage } from "@/components/mbti/mbti-test-page"

export default function MbtiRoutePage() {
  const router = useRouter()
  const { updateUser } = useAuth()

  return (
    <MBTITestPage
      onBack={() => router.push("/home")}
      onComplete={(mbti) => {
        updateUser({ mbti })
        router.push("/home")
      }}
    />
  )
}
