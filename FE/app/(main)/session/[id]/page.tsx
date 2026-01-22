"use client"

import { useParams, useRouter } from "next/navigation"
import { SessionRoom } from "@/components/session/session-room"

export default function SessionRoutePage() {
  const params = useParams()
  const router = useRouter()
  const id = typeof params.id === "string" ? params.id : params.id?.[0] ?? ""

  return <SessionRoom sessionId={id} onLeave={() => router.push("/home")} />
}
