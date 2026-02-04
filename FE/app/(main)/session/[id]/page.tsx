"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useSessionId } from "@/contexts/session-id-context"

/** 예전 URL(/session/[id]) 지원: ID를 컨텍스트에 넣고 /session으로 리다이렉트 */
export default function SessionIdRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const { setSessionId } = useSessionId()
  const id = typeof params.id === "string" ? params.id : params.id?.[0] ?? ""

  useEffect(() => {
    if (!id) {
      router.replace("/home")
      return
    }
    setSessionId(id)
    router.replace("/session")
  }, [id, setSessionId, router])

  return null
}
